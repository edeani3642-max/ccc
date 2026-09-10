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
    return text.replace(
        /\r?\n/g,
        "\r\n",
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
}

/* -------------------------------------------------------------------------- */
/* Handle stdin request                                                       */
/* -------------------------------------------------------------------------- */

async function handleStdin(
    worker: Worker,
): Promise<void> {
    console.log(
        "[python.ts] stdin-request received",
    );

    if (
        worker !== pythonWorker ||
        !stdinState ||
        !stdinBytes
    ) {
        console.log(
            "[python.ts] stdin request rejected: stale worker/channel",
        );

        return;
    }

    const state =
        stdinState;

    const bytes =
        stdinBytes;

    try {
        console.log(
            "[python.ts] waiting for terminal input",
        );

        const value =
            await runtime.writeIn();

        console.log(
            "[python.ts] input promise fulfilled:",
            JSON.stringify(value),
        );

        if (
            worker !== pythonWorker
        ) {
            console.log(
                "[python.ts] worker became obsolete",
            );

            return;
        }

        const encoded =
            textEncoder.encode(
                value,
            );

        console.log(
            "[python.ts] encoded input:",
            {
                value:
                    JSON.stringify(value),
                byteLength:
                    encoded.length,
            },
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

        console.log(
            "[python.ts] stdin buffer written",
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

        console.log(
            "[python.ts] notifying worker:",
            {
                status:
                    Atomics.load(
                        state,
                        0,
                    ),
                length:
                    Atomics.load(
                        state,
                        1,
                    ),
            },
        );

        Atomics.notify(
            state,
            0,
        );

        console.log(
            "[python.ts] stdin fulfillment sent to worker",
        );
    } catch (error) {
        console.log(
            "[python.ts] stdin promise rejected:",
            error,
        );
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
        "Python Runtime",
    );

    runtime.clear();

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
                            String(
                                data.text ?? "",
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
                        String(
                            data.message ??
                                "Unknown Python error.",
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