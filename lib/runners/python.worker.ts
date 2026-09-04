/// <reference lib="webworker" />

export {};

const worker = self as DedicatedWorkerGlobalScope;

interface PyodideInterface {
    runPythonAsync(code: string): Promise<unknown>;

    setStdout(options: {
        write?: (buffer: Uint8Array) => number;
        raw?: (charCode: number) => void;
    }): void;

    setStderr(options: {
        batched?: (text: string) => void;
    }): void;

    setStdin(options: {
        read?: (buffer: Uint8Array) => number;
        stdin?: () =>
            | string
            | Uint8Array
            | ArrayBuffer
            | number
            | null
            | undefined;
    }): void;
}

declare const loadPyodide: (options: {
    indexURL: string;
}) => Promise<PyodideInterface>;

const PYODIDE_INDEX_URL = "/pyodide/";
const PYODIDE_SCRIPT_URL = "/pyodide/pyodide.js";

/* -------------------------------------------------------------------------- */
/* Pyodide                                                                     */
/* -------------------------------------------------------------------------- */

let pyodide: PyodideInterface | null = null;
let pyodideLoading: Promise<PyodideInterface> | null = null;
let running = false;

/* -------------------------------------------------------------------------- */
/* Shared stdin                                                                */
/* -------------------------------------------------------------------------- */

let stdinBuffer: SharedArrayBuffer | null = null;
let stdinState: Int32Array | null = null;
let stdinBytes: Uint8Array | null = null;

const STDIN_WAITING = 0;
const STDIN_READY = 1;
const STDIN_CANCELLED = 2;

/* -------------------------------------------------------------------------- */
/* Encoding                                                                     */
/* -------------------------------------------------------------------------- */

const textDecoder = new TextDecoder("utf-8");
const textEncoder = new TextEncoder();

/*
 * Pyodide can give stdout to us in chunks which do not necessarily end
 * at a newline. Keep incomplete output here until a complete line arrives.
 */
let pendingStdout = "";

/* -------------------------------------------------------------------------- */
/* Messaging                                                                    */
/* -------------------------------------------------------------------------- */

function send(message: Record<string, unknown>): void {
    worker.postMessage(message);
}

/* -------------------------------------------------------------------------- */
/* Stdin                                                                        */
/* -------------------------------------------------------------------------- */

function initializeStdin(buffer: SharedArrayBuffer): void {
    stdinBuffer = buffer;
    stdinState = new Int32Array(buffer, 0, 2);
    stdinBytes = new Uint8Array(buffer, 8);
}

function readStdin(buffer: Uint8Array): number {
    if (!stdinState || !stdinBytes) {
        throw new Error(
            "Python stdin was requested before the stdin buffer was initialized.",
        );
    }

    const state = stdinState;
    const bytes = stdinBytes;

    /*
     * Anything Python wrote without a trailing newline immediately before
     * requesting stdin is the prompt.
     */
    const placeholder = pendingStdout;
    pendingStdout = "";

    Atomics.store(state, 1, 0);
    Atomics.store(state, 0, STDIN_WAITING);

    send({
        type: "stdin-request",
        placeholder,
    });

    while (true) {
        Atomics.wait(state, 0, STDIN_WAITING);

        const currentState = Atomics.load(state, 0);

        if (currentState === STDIN_CANCELLED) {
            throw new Error("Runtime cancelled");
        }

        if (currentState !== STDIN_READY) {
            continue;
        }

        const available = Atomics.load(state, 1);

        if (available <= 0) {
            Atomics.store(state, 0, STDIN_WAITING);
            continue;
        }

        const length = Math.min(
            available,
            buffer.length,
            bytes.length,
        );

        buffer.set(bytes.subarray(0, length));

        if (length < available) {
            bytes.copyWithin(0, length, available);
        }

        const remaining = available - length;

        Atomics.store(state, 1, remaining);

        if (remaining > 0) {
            Atomics.store(state, 0, STDIN_READY);
        } else {
            Atomics.store(state, 0, STDIN_WAITING);
        }

        return length;
    }
}

/* -------------------------------------------------------------------------- */
/* Stdout                                                                       */
/* -------------------------------------------------------------------------- */

function handleStdout(buffer: Uint8Array): void {
    /*
     * Decode UTF-8 exactly once.
     *
     * This is what preserves characters such as:
     *
     *     ×
     *     → 
     *     ✓
     *     é
     *     漢
     */
    const text = textDecoder.decode(buffer, {
        stream: true,
    });

    if (!text) {
        return;
    }

    pendingStdout += text;

    const parts = pendingStdout.split(/\r?\n/);

    /*
     * The final element is either an incomplete line or an empty string
     * when the output ended with a newline.
     */
    pendingStdout = parts.pop() ?? "";

    for (const line of parts) {
        send({
            type: "stdout",
            text: line,
        });
    }
}

function flushPendingStdout(): void {
    /*
     * Finish any UTF-8 sequence still held by TextDecoder.
     */
    const remainder = textDecoder.decode();

    if (remainder) {
        pendingStdout += remainder;
    }

    if (!pendingStdout) {
        return;
    }

    send({
        type: "stdout",
        text: pendingStdout,
    });

    pendingStdout = "";
}

/* -------------------------------------------------------------------------- */
/* Pyodide I/O                                                                  */
/* -------------------------------------------------------------------------- */

function configureIO(py: PyodideInterface): void {
    py.setStdout({
        write(buffer: Uint8Array) {
            handleStdout(buffer);

            /*
             * Pyodide expects the number of bytes successfully consumed.
             */
            return buffer.length;
        },
    });

    py.setStderr({
        batched(text: string) {
            send({
                type: "stderr",
                text,
            });
        },
    });

    /*
     * Native Pyodide stdin.
     *
     * Pyodide fills the supplied Uint8Array by calling this function.
     */
    py.setStdin({
        read: readStdin,
    });
}

/* -------------------------------------------------------------------------- */
/* Pyodide loading                                                              */
/* -------------------------------------------------------------------------- */

async function getPyodide(): Promise<PyodideInterface> {
    if (pyodide) {
        return pyodide;
    }

    if (pyodideLoading) {
        return pyodideLoading;
    }

    pyodideLoading = (async () => {
        worker.importScripts(PYODIDE_SCRIPT_URL);

        const instance = await loadPyodide({
            indexURL: PYODIDE_INDEX_URL,
        });

        pyodide = instance;

        return instance;
    })();

    return pyodideLoading;
}

/* -------------------------------------------------------------------------- */
/* Running Python                                                               */
/* -------------------------------------------------------------------------- */

async function runPython(code: string): Promise<void> {
    if (running) {
        send({
            type: "error",
            message: "A Python program is already running.",
        });

        return;
    }

    running = true;
    pendingStdout = "";

    try {
        const py = await getPyodide();

        configureIO(py);

        send({
            type: "ready",
        });

        await py.runPythonAsync(code);

        flushPendingStdout();

        send({
            type: "done",
        });
    } catch (error) {
        flushPendingStdout();

        send({
            type: "error",
            message:
                error instanceof Error
                    ? error.message
                    : String(error),
        });
    } finally {
        running = false;
    }
}

/* -------------------------------------------------------------------------- */
/* Worker messages                                                              */
/* -------------------------------------------------------------------------- */

worker.onmessage = (event: MessageEvent) => {
    const data = event.data;

    if (!data) {
        return;
    }

    switch (data.type) {
        case "init-stdin": {
            initializeStdin(data.buffer);
            break;
        }

        case "stdin-result": {
            if (!stdinState || !stdinBytes) {
                return;
            }

            const value = String(data.value ?? "");
            const encoded = textEncoder.encode(value + "\n");

            if (encoded.length > stdinBytes.length) {
                send({
                    type: "error",
                    message: "Input is too long.",
                });

                Atomics.store(stdinState, 1, 0);
                Atomics.store(
                    stdinState,
                    0,
                    STDIN_CANCELLED,
                );

                Atomics.notify(stdinState, 0);

                return;
            }

            stdinBytes.fill(0);
            stdinBytes.set(encoded);

            Atomics.store(
                stdinState,
                1,
                encoded.length,
            );

            Atomics.store(
                stdinState,
                0,
                STDIN_READY,
            );

            Atomics.notify(
                stdinState,
                0,
            );

            break;
        }

        case "stdin-cancel": {
            if (stdinState) {
                Atomics.store(stdinState, 1, 0);

                Atomics.store(
                    stdinState,
                    0,
                    STDIN_CANCELLED,
                );

                Atomics.notify(stdinState, 0);
            }

            break;
        }

        case "run": {
            void runPython(
                String(data.code ?? ""),
            );

            break;
        }

        case "cancel": {
            if (stdinState) {
                Atomics.store(stdinState, 1, 0);

                Atomics.store(
                    stdinState,
                    0,
                    STDIN_CANCELLED,
                );

                Atomics.notify(stdinState, 0);
            }

            break;
        }
    }
};