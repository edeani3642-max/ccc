type RunMessage = {
    type: "run";
    code: string;
    stdinBuffer: SharedArrayBuffer;
};

type Pyodide = {
    runPythonAsync(
        code: string,
    ): Promise<unknown>;

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
/* Stdin                                                                      */
/* -------------------------------------------------------------------------- */

const STDIN_WAITING = 0;
const STDIN_READY = 1;

let stdinState:
    Int32Array | null = null;

let stdinBytes:
    Uint8Array | null = null;

const decoder =
    new TextDecoder();

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

    const length =
        Atomics.load(
            state,
            1,
        );

    if (
        status !== STDIN_READY
    ) {
        return "";
    }

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
    importScripts(
        "/pyodide/pyodide.js",
    );

    return await loadPyodide({
        indexURL:
            "/pyodide/",
    });
}

/* -------------------------------------------------------------------------- */
/* Run Python                                                                 */
/* -------------------------------------------------------------------------- */

async function runPython(
    code: string,
    buffer: SharedArrayBuffer,
): Promise<void> {
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

    send({
        type: "initializing",
    });

    const pyodide =
        await loadPython();

    /* ---------------------------------------------------------------------- */
    /* stdout                                                                 */
    /* ---------------------------------------------------------------------- */

    pyodide.setStdout({
        raw(charCode) {
            const byte =
                new Uint8Array([
                    charCode,
                ]);

            const text =
                stdoutDecoder.decode(
                    byte,
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

    /* ---------------------------------------------------------------------- */
    /* stderr                                                                 */
    /* ---------------------------------------------------------------------- */

    pyodide.setStderr({
        raw(charCode) {
            const byte =
                new Uint8Array([
                    charCode,
                ]);

            const text =
                stderrDecoder.decode(
                    byte,
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

    /* ---------------------------------------------------------------------- */
    /* stdin                                                                  */
    /* ---------------------------------------------------------------------- */

    pyodide.setStdin({
        stdin: readStdin,
        autoEOF: true,
    });

    send({
        type: "ready",
    });

    await pyodide.runPythonAsync(
        code,
    );

    /* ---------------------------------------------------------------------- */
    /* Flush output                                                           */
    /* ---------------------------------------------------------------------- */

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
        );
    } catch (error) {
        send({
            type: "error",
            message:
                error instanceof Error
                    ? error.message
                    : String(error),
        });
    } finally {
        stdinState = null;
        stdinBytes = null;
    }
};