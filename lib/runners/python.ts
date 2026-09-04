import runtime from "@/lib/runtime/RunTime";

/* ============================================================================
 * Worker
 * ========================================================================== */

let pythonWorker:
    Worker | null = null;

/* ============================================================================
 * Shared stdin
 *
 * Offset 0 -> Int32 state
 * Offset 4 -> Int32 byte count
 * Offset 8 -> UTF-8 input bytes
 * ========================================================================== */

const STDIN_BUFFER_SIZE =
    64 * 1024;

const STDIN_WAITING =
    0;

const STDIN_READY =
    1;

const STDIN_CANCELLED =
    2;

let stdinBuffer:
    SharedArrayBuffer | null = null;

let stdinState:
    Int32Array | null = null;

let stdinBytes:
    Uint8Array | null = null;

const textEncoder =
    new TextEncoder();

/* ============================================================================
 * Runtime State
 * ========================================================================== */

let inputRequestActive =
    false;

/* ============================================================================
 * Shared stdin
 * ========================================================================== */

function getStdinBuffer():
    SharedArrayBuffer {

    if (stdinBuffer) {
        return stdinBuffer;
    }

    if (
        typeof SharedArrayBuffer ===
        "undefined"
    ) {
        throw new Error(
            "SharedArrayBuffer is unavailable. " +
            "The application must be cross-origin isolated " +
            "to use Python stdin.",
        );
    }

    stdinBuffer =
        new SharedArrayBuffer(
            STDIN_BUFFER_SIZE,
        );

    stdinState =
        new Int32Array(
            stdinBuffer,
            0,
            2,
        );

    stdinBytes =
        new Uint8Array(
            stdinBuffer,
            8,
        );

    return stdinBuffer;
}

/* ============================================================================
 * Cancel pending stdin
 * ========================================================================== */

function cancelPendingInput(): void {

    const buffer =
        getStdinBuffer();

    const state =
        new Int32Array(
            buffer,
            0,
            2,
        );

    Atomics.store(
        state,
        1,
        0,
    );

    Atomics.store(
        state,
        0,
        STDIN_CANCELLED,
    );

    Atomics.notify(
        state,
        0,
    );
}

/* ============================================================================
 * Handle stdin request
 * ========================================================================== */

async function handleInputRequest(
    placeholder: string,
): Promise<void> {

    if (inputRequestActive) {
        return;
    }

    inputRequestActive =
        true;

    try {

        /*
         * writeIn() displays the exact prompt supplied
         * by Python and handles terminal editing.
         */

        const value =
            await runtime.writeIn(
                placeholder,
            );

        /*
         * If the worker no longer exists, do not
         * attempt to publish input.
         */

        if (!pythonWorker) {
            return;
        }

        const buffer =
            getStdinBuffer();

        const state =
            stdinState ??
            new Int32Array(
                buffer,
                0,
                2,
            );

        const bytes =
            stdinBytes ??
            new Uint8Array(
                buffer,
                8,
            );

        const encoded =
            textEncoder.encode(
                String(
                    value ?? "",
                ) +
                "\n",
            );

        if (
            encoded.length >
            bytes.length
        ) {

            runtime.writeErr(
                "[Runtime Error]",
            );

            runtime.writeErr(
                "Input is too long.",
            );

            cancelPendingInput();

            return;
        }

        /*
         * Write the input bytes.
         */

        bytes.fill(
            0,
        );

        bytes.set(
            encoded,
        );

        /*
         * Publish the byte count first.
         */

        Atomics.store(
            state,
            1,
            encoded.length,
        );

        /*
         * Then publish READY.

         * The worker will wake and consume the bytes.
         */

        Atomics.store(
            state,
            0,
            STDIN_READY,
        );

        Atomics.notify(
            state,
            0,
        );

    } catch (error) {

        cancelPendingInput();

        if (
            error instanceof Error &&
            error.message ===
            "Runtime cancelled"
        ) {
            return;
        }

        runtime.writeErr(
            error instanceof Error
                ? error.message
                : String(error),
        );

    } finally {

        inputRequestActive =
            false;
    }
}

/* ============================================================================
 * Worker message handler
 * ========================================================================== */

function handleWorkerMessage(
    event: MessageEvent,
): void {

    const data =
        event.data;

    if (!data) {
        return;
    }

    switch (
        data.type
    ) {

        /* --------------------------------------------------------------------
         * stdout
         * ------------------------------------------------------------------ */

        case "stdout":

            runtime.writeOut(
                String(
                    data.text ?? "",
                ),
            );

            break;

        /* --------------------------------------------------------------------
         * debug
         * ------------------------------------------------------------------ */

        case "debug":

            runtime.writeOut(
                String(
                    data.message ?? "",
                ),
                "90",
            );

            break;

        /* --------------------------------------------------------------------
         * stderr
         * ------------------------------------------------------------------ */

        case "stderr":

            runtime.writeErr(
                String(
                    data.text ?? "",
                ),
            );

            break;

        /* --------------------------------------------------------------------
         * Pyodide ready
         * ------------------------------------------------------------------ */

        case "ready":

            runtime.writeOut(
                "[System] Ready",
                "90",
            );

            break;

        /* --------------------------------------------------------------------
         * stdin request
         * ------------------------------------------------------------------ */

        case "stdin-request":

            void handleInputRequest(
                String(
                    data.placeholder ?? "",
                ),
            );

            break;

        /* --------------------------------------------------------------------
         * Program finished
         * ------------------------------------------------------------------ */

        case "done":

            runtime.writeOut(
                "[System] Program Finished",
                "90",
            );

            break;

        /* --------------------------------------------------------------------
         * Program failed
         * ------------------------------------------------------------------ */

        case "error":

            runtime.writeErr(
                "[Runtime Error]",
            );

            runtime.writeErr(
                String(
                    data.message ??
                    "Unknown error.",
                ),
            );

            runtime.writeErr(
                "[System] Program Failed",
            );

            break;
    }
}

/* ============================================================================
 * Worker error handler
 * ========================================================================== */

function handleWorkerError(
    event: ErrorEvent,
): void {

    runtime.writeErr(
        "[Runtime Error]",
    );

    runtime.writeErr(
        event.message ||
        "Python worker failed.",
    );

    runtime.writeErr(
        "[System] Program Failed",
    );

    inputRequestActive =
        false;

    pythonWorker =
        null;
}

/* ============================================================================
 * Create / Get persistent worker
 * ========================================================================== */

function getPythonWorker():
    Worker {

    if (pythonWorker) {
        return pythonWorker;
    }

    const worker =
        new Worker(
            new URL(
                "./python.worker.ts",
                import.meta.url,
            ),
            {
                type: "module",
            },
        );

    worker.onmessage =
        handleWorkerMessage;

    worker.onerror =
        handleWorkerError;

    pythonWorker =
        worker;

    /*
     * Initialize the shared stdin channel once.
     */

    worker.postMessage({
        type:
            "init-stdin",

        buffer:
            getStdinBuffer(),
    });

    return worker;
}

/* ============================================================================
 * Run Python
 * ========================================================================== */

export async function runPython(
    code: string,
): Promise<void> {

    runtime.open(
        "Python Runtime",
    );

    runtime.clear();

    inputRequestActive =
        false;

    runtime.writeOut(
        "[System] Initializing Python Runtime...",
        "90",
    );

    try {

        const worker =
            getPythonWorker();

        worker.postMessage({
            type:
                "run",

            /*
             * Student source is passed unchanged.
             */

            code,
        });

    } catch (error) {

        runtime.writeErr(
            "[Runtime Error]",
        );

        runtime.writeErr(
            error instanceof Error
                ? error.message
                : String(error),
        );

        runtime.writeErr(
            "[System] Program Failed",
        );
    }
}

/* ============================================================================
 * Cancel Python
 *
 * This wakes a blocked stdin read but does NOT
 * terminate the persistent worker.
 * ========================================================================== */

export function cancelPython(): void {

    cancelPendingInput();

    pythonWorker?.postMessage({
        type:
            "cancel",
    });

    inputRequestActive =
        false;
}