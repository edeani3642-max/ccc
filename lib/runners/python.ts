import runtime from "@/lib/runtime/RunTime";

/* -------------------------------------------------------------------------- */
/* Worker                                                                     */
/* -------------------------------------------------------------------------- */

let pythonWorker: Worker | null = null;

let runActive = false;

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
/* Stdin                                                                      */
/* -------------------------------------------------------------------------- */

const STDIN_BUFFER_SIZE =
    64 * 1024;

const STDIN_WAITING = 0;
const STDIN_READY = 1;
const STDIN_CANCELLED = 2;

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
/* Interrupt                                                                  */
/* -------------------------------------------------------------------------- */

const INTERRUPT_BUFFER_SIZE = 4;

const INTERRUPT_NONE = 0;
const INTERRUPT_SIGNAL = 2;

let interruptBuffer:
    SharedArrayBuffer | null =
    null;

let interruptState:
    Int32Array | null =
    null;

function createInterruptBuffer(): SharedArrayBuffer {
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
            INTERRUPT_BUFFER_SIZE,
        );

    interruptBuffer =
        buffer;

    interruptState =
        new Int32Array(
            buffer,
        );

    Atomics.store(
        interruptState,
        0,
        INTERRUPT_NONE,
    );

    return buffer;
}

/* -------------------------------------------------------------------------- */
/* Stop current process                                                       */
/* -------------------------------------------------------------------------- */

function interruptPython(): void {
    if (!runActive) {
        return;
    }

    /*
     * If Python is currently waiting for input,
     * release the blocking Atomics.wait().
     */
    if (stdinState) {
        Atomics.store(
            stdinState,
            0,
            STDIN_CANCELLED,
        );

        Atomics.notify(
            stdinState,
            0,
        );
    }

    /*
     * Cancel the terminal's pending input promise.
     */
    runtime.cancelInput();

    /*
     * Send SIGINT (2) to Pyodide.
     * This is the actual keyboard interrupt.
     */
    if (interruptState) {
        Atomics.store(
            interruptState,
            0,
            INTERRUPT_SIGNAL,
        );
    }
}

/* -------------------------------------------------------------------------- */
/* Destroy worker                                                             */
/* -------------------------------------------------------------------------- */

function destroyWorker(): void {
    runtime.cancelInput();

    if (pythonWorker) {
        pythonWorker.terminate();

        pythonWorker = null;
    }

    runActive = false;

    stdinBuffer = null;
    stdinState = null;
    stdinBytes = null;

    interruptBuffer = null;
    interruptState = null;

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
            worker !== pythonWorker ||
            !runActive
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
/* Create worker                                                              */
/* -------------------------------------------------------------------------- */

function createWorker(): Worker {
    if (pythonWorker) {
        return pythonWorker;
    }

    const worker =
        new Worker(
            new URL(
                "./python.worker.ts",
                import.meta.url,
            ),
        );

    pythonWorker =
        worker;

    /* ---------------------------------------------------------------------- */
    /* Worker messages                                                         */
    /* ---------------------------------------------------------------------- */

    worker.onmessage = (
        event: MessageEvent,
    ) => {
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
            /* ---------------------------------------------------------------- */
            /* Initializing                                                      */
            /* ---------------------------------------------------------------- */

            case "initializing": {
                runtime.writeOut(
                    terminalText(
                        "[System] Initializing Python Runtime...\n",
                    ),
                    "90",
                );

                break;
            }

            /* ---------------------------------------------------------------- */
            /* Ready                                                             */
            /* ---------------------------------------------------------------- */

            case "ready": {
                runtime.writeOut(
                    terminalText(
                        "[System] Running program...\n",
                    ),
                    "90",
                );

                break;
            }

            /* ---------------------------------------------------------------- */
            /* stdout                                                            */
            /* ---------------------------------------------------------------- */

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

            /* ---------------------------------------------------------------- */
            /* stderr                                                            */
            /* ---------------------------------------------------------------- */

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

            /* ---------------------------------------------------------------- */
            /* stdin                                                             */
            /* ---------------------------------------------------------------- */

            case "stdin-request": {
                void handleStdin(
                    worker,
                );

                break;
            }

            /* ---------------------------------------------------------------- */
            /* Finished                                                          */
            /* ---------------------------------------------------------------- */

            case "done": {
                runActive = false;

                runtime.cancelInput();

                stdinBuffer = null;
                stdinState = null;
                stdinBytes = null;

                if (
                    interruptState
                ) {
                    Atomics.store(
                        interruptState,
                        0,
                        INTERRUPT_NONE,
                    );
                }

                runtime.writeOut(
                    terminalText(
                        "\n[System] Program Finished\n",
                    ),
                    "90",
                );

                break;
            }

            /* ---------------------------------------------------------------- */
            /* Cancelled                                                        */
            /* ---------------------------------------------------------------- */

            case "cancelled": {
                runActive = false;

                runtime.cancelInput();

                stdinBuffer = null;
                stdinState = null;
                stdinBytes = null;

                if (
                    interruptState
                ) {
                    Atomics.store(
                        interruptState,
                        0,
                        INTERRUPT_NONE,
                    );
                }

                break;
            }

            /* ---------------------------------------------------------------- */
            /* Error                                                             */
            /* ---------------------------------------------------------------- */

            case "error": {
                runActive = false;

                runtime.cancelInput();

                stdinBuffer = null;
                stdinState = null;
                stdinBytes = null;

                if (
                    interruptState
                ) {
                    Atomics.store(
                        interruptState,
                        0,
                        INTERRUPT_NONE,
                    );
                }

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

                break;
            }
        }
    };

    /* ---------------------------------------------------------------------- */
    /* Worker error                                                           */
    /* ---------------------------------------------------------------------- */

    worker.onerror = (
        event: ErrorEvent,
    ) => {
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

        pythonWorker = null;
        runActive = false;

        stdinBuffer = null;
        stdinState = null;
        stdinBytes = null;

        interruptBuffer = null;
        interruptState = null;
    };

    return worker;
}

/* -------------------------------------------------------------------------- */
/* Run Python                                                                 */
/* -------------------------------------------------------------------------- */

export async function runPython(
    code: string,
): Promise<void> {
    /*
     * If a program is already running,
     * interrupt it first.
     *
     * The interrupt must happen before
     * waiting for the old execution to finish,
     * otherwise infinite loops cannot be stopped.
     */
    if (runActive) {
        interruptPython();

        /*
         * Show that the previous execution
         * has been stopped.
         */
        runtime.writeOut(
            terminalText(
                "\n[System] Program Finished\n",
            ),
            "90",
        );

        /*
         * Wait until the old execution has
         * completely unwound before starting
         * the new one.
         */
        await new Promise<void>(
            (resolve) => {
                const check =
                    () => {
                        if (!runActive) {
                            resolve();

                            return;
                        }

                        setTimeout(
                            check,
                            10,
                        );
                    };

                check();
            },
        );
    }

    runtime.open(
        "Python",
    );

    try {
        const buffer =
            createStdinBuffer();

        if (!interruptBuffer) {
            createInterruptBuffer();
        }

        if (interruptState) {
            Atomics.store(
                interruptState,
                0,
                INTERRUPT_NONE,
            );
        }

        const worker =
            createWorker();

        runActive = true;

        worker.postMessage({
            type: "run",
            code,
            stdinBuffer:
                buffer,
            interruptBuffer:
                interruptBuffer,
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