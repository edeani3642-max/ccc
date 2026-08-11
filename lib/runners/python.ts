import runtime from "@/lib/runtime/RunTime";


let pythonWorker: Worker | null = null;



/* ============================================================================
 * Create Python Worker
 * ========================================================================== */

function createPythonWorker(): Worker {


    const worker = new Worker(

        new URL(

            "./python.worker.ts",

            import.meta.url,

        ),

        {
            type: "module",
        },

    );



    worker.onmessage = (

        event: MessageEvent,

    ) => {


        const data =
            event.data;


        if (!data) {
            return;
        }



        switch (data.type) {


            /* ================================================================
             * Worker ready
             * ============================================================= */

            case "ready":


                runtime.writeOut(

                    "[System] Done",

                    "90",

                );


                break;



            /* ================================================================
             * stdout
             * ============================================================= */

            case "writeOut":


                runtime.writeOut(

                    data.text,

                    data.color,

                );


                break;



            /* ================================================================
             * stderr
             * ============================================================= */

            case "writeErr":


                runtime.writeErr(

                    data.text,

                );


                break;



            /* ================================================================
             * stdin
             * ============================================================= */

            case "stdin-request":


                handleInputRequest(

                    data.requestId,

                    data.prompt ?? "",

                );


                break;



            /* ================================================================
             * Finished
             * ============================================================= */

            case "done":


                runtime.writeOut(

                    "[System] Program Finished",

                    "90",

                );


                break;



            /* ================================================================
             * Error
             * ============================================================= */

            case "error":


                runtime.writeErr(

                    "[Runtime Error]",

                );


                runtime.writeErr(

                    data.message ??
                    "Unknown error",

                );


                runtime.writeErr(

                    "[System] Program Failed",

                );


                break;


        }


    };


    return worker;

}



/* ============================================================================
 * Get Worker
 * ========================================================================== */

function getPythonWorker(): Worker {


    if (!pythonWorker) {

        pythonWorker =
            createPythonWorker();

    }


    return pythonWorker;

}



/* ============================================================================
 * Handle stdin
 * ========================================================================== */

async function handleInputRequest(

    requestId: string,

    prompt: string,

): Promise<void> {


    try {


        const value =
            await runtime.writeIn(

                prompt,

            );



        pythonWorker?.postMessage({

            type:
                "stdin-result",

            requestId,

            value,

        });


    } catch (error) {


        pythonWorker?.postMessage({

            type:
                "stdin-cancel",

            requestId,

            message:
                error instanceof Error
                    ? error.message
                    : String(error),

        });


    }

}



/* ============================================================================
 * Run Python
 * ========================================================================== */

export async function runPython(

    code: string,

): Promise<void> {


    /*
     * Kill any previous execution.
     */

    if (pythonWorker) {

        pythonWorker.terminate();

        pythonWorker = null;

    }



    runtime.open(

        "Python Runtime",

    );


    runtime.clear();



    runtime.writeOut(

        "[System] Initializing Python Runtime...",

        "90",

    );



    const worker =
        getPythonWorker();



    worker.postMessage({

        type:
            "run",

        code,

    });


}



/* ============================================================================
 * Cancel Python
 * ========================================================================== */

export function cancelPython(): void {


    if (pythonWorker) {


        pythonWorker.postMessage({

            type:
                "cancel",

        });



        /*
         * Force stop execution.
         */

        pythonWorker.terminate();


        pythonWorker =
            null;

    }



    runtime.clear();


}