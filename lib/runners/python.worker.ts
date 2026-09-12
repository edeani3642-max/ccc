// Worker

type RunMessage = {
    type: "run";
    code: string;
    stdinBuffer: SharedArrayBuffer;
    interruptBuffer: SharedArrayBuffer;
};

type PyProxy = {
    destroy(): void;
};

type Pyodide = {
    runPython(
        code: string,
    ): PyProxy;

    runPythonAsync(
        code: string,
        options?: {
            globals?: PyProxy;
            locals?: PyProxy;
        },
    ): Promise<unknown>;

    setInterruptBuffer(
        buffer: Int32Array,
    ): void;

    setStdin(options: {
        stdin: () => string | undefined;
        autoEOF?: boolean;
    }): void;

    setStdout(options: {
        raw?: (
            charCode: number,
        ) => void;

        isatty?: boolean;
    }): void;

    setStderr(options: {
        raw?: (
            charCode: number,
        ) => void;

        isatty?: boolean;
    }): void;
};

type LoadPyodide = (
    options: {
        indexURL: string;
    },
) => Promise<Pyodide>;

declare const loadPyodide: LoadPyodide;

declare function importScripts(
    ...urls: string[]
): void;

/* -------------------------------------------------------------------------- */
/* Pyodide                                                                     */
/* -------------------------------------------------------------------------- */

let pyodide:
    Pyodide | null = null;

let pyodideLoading:
    Promise<Pyodide> | null = null;

/* -------------------------------------------------------------------------- */
/* Stdin                                                                      */
/* -------------------------------------------------------------------------- */

const STDIN_WAITING = 0;
const STDIN_READY = 1;
const STDIN_CANCELLED = 2;

let stdinState:
    Int32Array | null = null;

let stdinBytes:
    Uint8Array | null = null;

let stdinCancelled = false;

const decoder =
    new TextDecoder();

/* -------------------------------------------------------------------------- */
/* Interrupt                                                                  */
/* -------------------------------------------------------------------------- */

const INTERRUPT_NONE = 0;
const INTERRUPT_SIGNAL = 2;

let interruptState:
    Int32Array | null = null;

/* -------------------------------------------------------------------------- */
/* Output decoding                                                            */
/* -------------------------------------------------------------------------- */

const stdoutDecoder =
    new TextDecoder();

const stderrDecoder =
    new TextDecoder();

/* -------------------------------------------------------------------------- */
/* Messaging                                                                  */
/* -------------------------------------------------------------------------- */

function send(
    message: unknown,
): void {
    self.postMessage(message);
}

/* -------------------------------------------------------------------------- */
/* Stdin                                                                      */
/* -------------------------------------------------------------------------- */

function readStdin(): string {
    if (
        !stdinState ||
        !stdinBytes
    ) {
        return "";
    }

    const state =
        stdinState;

    const bytes =
        stdinBytes;

    send({
        type: "stdin-request",
    });

    Atomics.wait(
        state,
        0,
        STDIN_WAITING,
    );

    const status =
        Atomics.load(
            state,
            0,
        );

    /*
     * The current execution was cancelled
     * while waiting for input.
     */
    if (
        status === STDIN_CANCELLED
    ) {
        stdinCancelled = true;

        return "";
    }

    if (
        status !== STDIN_READY
    ) {
        return "";
    }

    const length =
        Atomics.load(
            state,
            1,
        );

    const copiedBytes =
        new Uint8Array(
            length,
        );

    copiedBytes.set(
        bytes.subarray(
            0,
            length,
        ),
    );

    const value =
        decoder.decode(
            copiedBytes,
        );

    Atomics.store(
        state,
        1,
        0,
    );

    Atomics.store(
        state,
        0,
        STDIN_WAITING,
    );

    return value;
}

/* -------------------------------------------------------------------------- */
/* Load Pyodide                                                               */
/* -------------------------------------------------------------------------- */

async function loadPython(): Promise<Pyodide> {
    if (pyodide) {
        return pyodide;
    }

    if (pyodideLoading) {
        return pyodideLoading;
    }

    pyodideLoading =
        (async () => {
            importScripts(
                "/pyodide/pyodide.js",
            );

            const instance =
                await loadPyodide({
                    indexURL:
                        "/pyodide/",
                });

            pyodide =
                instance;

            return instance;
        })();

    try {
        return await pyodideLoading;
    } finally {
        pyodideLoading = null;
    }
}

/* -------------------------------------------------------------------------- */
/* Configure output                                                            */
/* -------------------------------------------------------------------------- */

function configureOutput(
    instance: Pyodide,
): void {
    instance.setStdout({
        raw(charCode) {
            const text =
                stdoutDecoder.decode(
                    new Uint8Array([
                        charCode,
                    ]),
                    {
                        stream: true,
                    },
                );

            if (text) {
                send({
                    type: "stdout",
                    text,
                });
            }
        },
    });

    instance.setStderr({
        raw(charCode) {
            const text =
                stderrDecoder.decode(
                    new Uint8Array([
                        charCode,
                    ]),
                    {
                        stream: true,
                    },
                );

            if (text) {
                send({
                    type: "stderr",
                    text,
                });
            }
        },
    });
}

/* -------------------------------------------------------------------------- */
/* Run Python                                                                 */
/* -------------------------------------------------------------------------- */

async function runPython(
    code: string,
    buffer: SharedArrayBuffer,
    interruptBuffer: SharedArrayBuffer,
): Promise<void> {
    stdinCancelled = false;

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

    /* ---------------------------------------------------------------------- */
    /* Interrupt buffer                                                       */
    /* ---------------------------------------------------------------------- */

    interruptState =
        new Int32Array(
            interruptBuffer,
        );

    Atomics.store(
        interruptState,
        0,
        INTERRUPT_NONE,
    );

    /* ---------------------------------------------------------------------- */
    /* Load Pyodide                                                           */
    /* ---------------------------------------------------------------------- */

    const wasLoaded =
        pyodide !== null;

    if (!wasLoaded) {
        send({
            type: "initializing",
        });
    }

    const instance =
        await loadPython();

    /* ---------------------------------------------------------------------- */
    /* Configure output                                                       */
    /* ---------------------------------------------------------------------- */

    if (!wasLoaded) {
        configureOutput(
            instance,
        );
    }

    /* ---------------------------------------------------------------------- */
    /* Configure interrupt                                                    */
    /* ---------------------------------------------------------------------- */

    instance.setInterruptBuffer(
        interruptState,
    );

    /* ---------------------------------------------------------------------- */
    /* Configure stdin                                                        */
    /* ---------------------------------------------------------------------- */

    instance.setStdin({
        stdin: readStdin,
        autoEOF: true,
    });

    /* ---------------------------------------------------------------------- */
    /* Fresh namespace                                                        */
    /* ---------------------------------------------------------------------- */

    const namespace =
        instance.runPython(
            "{}",
        );

    try {
        send({
            type: "ready",
        });

        await instance.runPythonAsync(
            code,
            {
                globals:
                    namespace,

                locals:
                    namespace,
            },
        );

        /*
         * If the stdin mechanism was cancelled,
         * this execution must not be considered
         * a normal successful execution.
         */
        if (
            stdinCancelled
        ) {
            send({
                type: "cancelled",
            });

            return;
        }

        /* ------------------------------------------------------------------ */
        /* Flush output                                                       */
        /* ------------------------------------------------------------------ */

        const remainingStdout =
            stdoutDecoder.decode();

        if (remainingStdout) {
            send({
                type: "stdout",
                text: remainingStdout,
            });
        }

        const remainingStderr =
            stderrDecoder.decode();

        if (remainingStderr) {
            send({
                type: "stderr",
                text: remainingStderr,
            });
        }

        send({
            type: "done",
        });
    } catch (error) {
        /*
         * input() throws EOFError when our cancellation
         * wakes readStdin() and it returns an empty string.
         *
         * Treat that as cancellation instead of exposing
         * it as a Python runtime error.
         */
        if (
            stdinCancelled
        ) {
            send({
                type: "cancelled",
            });

            return;
        }

        throw error;
    } finally {
        /*
         * Destroy only this execution's namespace.
         *
         * Pyodide itself remains alive.
         */
        namespace.destroy();

        stdinState = null;
        stdinBytes = null;
        interruptState = null;
    }
}

/* -------------------------------------------------------------------------- */
/* Worker message                                                             */
/* -------------------------------------------------------------------------- */

self.onmessage = async (
    event: MessageEvent<RunMessage>,
) => {
    const data =
        event.data;

    if (
        !data ||
        data.type !== "run"
    ) {
        return;
    }

    try {
        await runPython(
            data.code,
            data.stdinBuffer,
            data.interruptBuffer,
        );
    } catch (error) {
        send({
            type: "error",
            message:
                error instanceof Error
                    ? error.message
                    : String(error),
        });
    }
};