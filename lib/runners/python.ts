import runtime from "@/lib/runtime/RunTime";

/* -------------------------------------------------------------------------- */
/* Worker                                                                     */
/* -------------------------------------------------------------------------- */

let pythonWorker: Worker | null = null;

/* -------------------------------------------------------------------------- */
/* Stdin                                                                      */
/* -------------------------------------------------------------------------- */

const STDIN_BUFFER_SIZE =
    64 * 1024;

const STDIN_WAITING = 0;
const STDIN_READY = 1;

const textEncoder =
    new TextEncoder();

let stdinBuffer:
    SharedArrayBuffer | null =
    null;

let stdinState:
    Int32Array | null =
    null;

let stdinBytes:
    Uint8Array | null =
    null;

/* -------------------------------------------------------------------------- */
/* Terminal text                                                              */
/* -------------------------------------------------------------------------- */

function terminalText(
    text: string,
): string {
    return text
        .replace(
            /\r\n/g,
            "\n",
        )
        .replace(
            /\r/g,
            "\n",
        )
        .replace(
            /\n/g,
            "\r\n",
        );
}

/* -------------------------------------------------------------------------- */
/* Python error formatting                                                    */
/* -------------------------------------------------------------------------- */

function cleanPythonError(
    text: string,
): string {
    return text.replace(
        /[ \t]{20,}/g,
        "    ",
    );
}

/* -------------------------------------------------------------------------- */
/* Create stdin buffer                                                        */
/* -------------------------------------------------------------------------- */

function createStdinBuffer(): SharedArrayBuffer {
    if (
        typeof SharedArrayBuffer ===
        "undefined"
    ) {
        throw new Error(
            "SharedArrayBuffer is unavailable. " +
            "Cross-origin isolation is required.",
        );
    }

    const buffer =
        new SharedArrayBuffer(
            STDIN_BUFFER_SIZE,
        );

    stdinBuffer =
        buffer;

    stdinState =
        new Int32Array(
            buffer,
            0,
            2,
        );

    stdinBytes =
        new Uint8Array(
            buffer,
            8,
        );

    Atomics.store(
        stdinState,
        0,
        STDIN_WAITING,
    );

    Atomics.store(
        stdinState,
        1,
        0,
    );

    return buffer;
}

/* -------------------------------------------------------------------------- */
/* Destroy worker                                                             */
/* -------------------------------------------------------------------------- */

function destroyWorker(): void {
    /*
     * Stop the terminal from waiting for input.
     */
    runtime.cancelInput();

    /*
     * Terminating the worker is the actual
     * cancellation of Python execution.
     */
    if (pythonWorker) {
        pythonWorker.terminate();
        pythonWorker = null;
    }

    /*
     * Release references to the old stdin
     * communication channel.
     */
    stdinBuffer = null;
    stdinState = null;
    stdinBytes = null;

    runtime.clear();
}

/* -------------------------------------------------------------------------- */
/* Handle stdin request                                                       */
/* -------------------------------------------------------------------------- */

async function handleStdin(
    worker: Worker,
): Promise<void> {
    if (
        worker !== pythonWorker ||
        !stdinState ||
        !stdinBytes
    ) {
        return;
    }

    const state =
        stdinState;

    const bytes =
        stdinBytes;

    try {
        const value =
            await runtime.writeIn();

        if (
            worker !== pythonWorker
        ) {
            return;
        }

        const encoded =
            textEncoder.encode(
                value,
            );

        if (
            encoded.length >
            bytes.length
        ) {
            runtime.writeErr(
                "Input is too long.",
            );

            destroyWorker();

            return;
        }

        bytes.fill(0);

        bytes.set(
            encoded,
        );

        Atomics.store(
            state,
            1,
            encoded.length,
        );

        Atomics.store(
            state,
            0,
            STDIN_READY,
        );

        Atomics.notify(
            state,
            0,
        );
    } catch {
        // Input was cancelled.
    }
}

/* -------------------------------------------------------------------------- */
/* Run Python                                                                 */
/* -------------------------------------------------------------------------- */

export async function runPython(
    code: string,
): Promise<void> {
    /*
     * Every execution gets a completely new worker.
     */
    destroyWorker();

    runtime.open(
        "Python",
    );

    try {
        const buffer =
            createStdinBuffer();

        const worker =
            new Worker(
                new URL(
                    "./python.worker.ts",
                    import.meta.url,
                ),
            );

        pythonWorker =
            worker;

        /* ------------------------------------------------------------------ */
        /* Worker messages                                                     */
        /* ------------------------------------------------------------------ */

        worker.onmessage = (
            event: MessageEvent,
        ) => {
            /*
             * Ignore anything coming from a worker
             * that has already been replaced.
             */
            if (
                worker !== pythonWorker
            ) {
                return;
            }

            const data =
                event.data;

            if (!data) {
                return;
            }

            switch (data.type) {
                /* ---------------------------------------------------------- */
                /* Initializing                                                */
                /* ---------------------------------------------------------- */

                case "initializing": {
                    runtime.writeOut(
                        terminalText(
                            "[System] Initializing Python Runtime...\n",
                        ),
                        "90",
                    );

                    break;
                }

                /* ---------------------------------------------------------- */
                /* Ready                                                       */
                /* ---------------------------------------------------------- */

                case "ready": {
                    runtime.writeOut(
                        terminalText(
                            "[System] Ready\n",
                        ),
                        "90",
                    );

                    break;
                }

                /* ---------------------------------------------------------- */
                /* stdout                                                      */
                /* ---------------------------------------------------------- */

                case "stdout": {
                    runtime.writeOut(
                        terminalText(
                            String(
                                data.text ?? "",
                            ),
                        ),
                    );

                    break;
                }

                /* ---------------------------------------------------------- */
                /* stderr                                                      */
                /* ---------------------------------------------------------- */

                case "stderr": {
                    runtime.writeErr(
                        terminalText(
                            cleanPythonError(
                                String(
                                    data.text ?? "",
                                ),
                            ),
                        ),
                    );

                    break;
                }

                /* ---------------------------------------------------------- */
                /* stdin                                                       */
                /* ---------------------------------------------------------- */

                case "stdin-request": {
                    void handleStdin(
                        worker,
                    );

                    break;
                }

                /* ---------------------------------------------------------- */
                /* Finished                                                    */
                /* ---------------------------------------------------------- */

                case "done": {
                    runtime.cancelInput();

                    if (
                        worker ===
                        pythonWorker
                    ) {
                        worker.terminate();

                        pythonWorker =
                            null;

                        stdinBuffer =
                            null;

                        stdinState =
                            null;

                        stdinBytes =
                            null;
                    }

                    runtime.writeOut(
                        terminalText(
                            "[System] Program Finished\n",
                        ),
                        "90",
                    );

                    break;
                }

                /* ---------------------------------------------------------- */
                /* Error                                                       */
                /* ---------------------------------------------------------- */

                case "error": {
                    runtime.cancelInput();

                    runtime.writeErr(
                        terminalText(
                            cleanPythonError(
                                String(
                                    data.message ??
                                        "Unknown Python error.",
                                ),
                            ),
                        ),
                    );

                    if (
                        worker ===
                        pythonWorker
                    ) {
                        worker.terminate();

                        pythonWorker =
                            null;

                        stdinBuffer =
                            null;

                        stdinState =
                            null;

                        stdinBytes =
                            null;
                    }

                    break;
                }
            }
        };

        /* ------------------------------------------------------------------ */
        /* Worker error                                                       */
        /* ------------------------------------------------------------------ */

        worker.onerror = (
            event: ErrorEvent,
        ) => {
            /*
             * Ignore errors from an obsolete worker.
             */
            if (
                worker !== pythonWorker
            ) {
                return;
            }

            runtime.cancelInput();

            runtime.writeErr(
                event.message ||
                    "Python worker failed.",
            );

            worker.terminate();

            pythonWorker =
                null;

            stdinBuffer =
                null;

            stdinState =
                null;

            stdinBytes =
                null;
        };

        /* ------------------------------------------------------------------ */
        /* Start execution                                                    */
        /* ------------------------------------------------------------------ */

        worker.postMessage({
            type: "run",
            code,
            stdinBuffer:
                buffer,
        });
    } catch (error) {
        destroyWorker();

        runtime.writeErr(
            error instanceof Error
                ? error.message
                : String(error),
        );
    }
}

/* -------------------------------------------------------------------------- */
/* Cancel Python                                                              */
/* -------------------------------------------------------------------------- */

export function cancelPython(): void {
    destroyWorker();
}