/// <reference lib="webworker" />

export {};


/* ============================================================================
 * Worker Scope
 * ========================================================================== */

const workerScope =
    self as unknown as DedicatedWorkerGlobalScope;



/* ============================================================================
 * Pyodide Types
 * ========================================================================== */

interface PyodideInterface {

    runPythonAsync(
        code: string,
    ): Promise<any>;


    setStdout(
        options: {
            batched: (
                text: string,
            ) => void;
        },
    ): void;


    setStderr(
        options: {
            batched: (
                text: string,
            ) => void;
        },
    ): void;


    globals: {

        set(
            name: string,
            value: any,
        ): void;

    };

}



/* ============================================================================
 * Local Pyodide
 * ========================================================================== */

const PYODIDE_INDEX_URL =

    "/pyodide/";


const PYODIDE_SCRIPT_URL =

    "/pyodide/pyodide.js";



/* ============================================================================
 * Runtime State
 * ========================================================================== */


let pyodide:

    PyodideInterface | null =

        null;



let pyodideLoading:

    Promise<PyodideInterface> | null =

        null;



let cancelled = false;


/* ============================================================================
 * Helper Functions
 * ========================================================================== */


/*
 * Load Pyodide once and cache it.
 */

async function getPyodide():

    Promise<PyodideInterface> {


    /*
     * Already loaded.
     */

    if (pyodide) {

        return pyodide;

    }



    /*
     * Currently loading.
     */

    if (pyodideLoading) {

        return pyodideLoading;

    }



    /*
     * Start loading.
     */

    pyodideLoading =

        (async () => {


            /*
             * Load local Pyodide script.
             */

            workerScope.importScripts(

                PYODIDE_SCRIPT_URL,

            );



            const loadPyodide =

                (workerScope as any).loadPyodide;



            if (

                typeof loadPyodide !==
                "function"

            ) {

                throw new Error(

                    "Pyodide loader unavailable.",

                );

            }



            const instance =

                await loadPyodide({

                    indexURL:

                        PYODIDE_INDEX_URL,

                });



            pyodide = instance;


            return instance;


        })();



    return pyodideLoading;

}





/*
 * Send event to main thread.
 */

function send(

    message: Record<string, any>,

): void {


    workerScope.postMessage(

        message,

    );

}





/*
 * Request terminal input from main thread.
 */

function requestInput(

    prompt: string,

): Promise<string> {


    return new Promise(

        (

            resolve,

            reject,

        ) => {


            const requestId =

                crypto.randomUUID();




            function onMessage(

                event: MessageEvent,

            ) {


                const data =

                    event.data;



                if (!data) {

                    return;

                }




                if (

                    data.requestId !==
                    requestId

                ) {

                    return;

                }




                if (

                    data.type !==
                    "stdin-result"

                    &&

                    data.type !==
                    "stdin-cancel"

                ) {

                    return;

                }




                workerScope.removeEventListener(

                    "message",

                    onMessage,

                );




                if (

                    data.type ===
                    "stdin-cancel"

                ) {


                    reject(

                        new Error(

                            data.message ??
                            "Input cancelled.",

                        ),

                    );


                    return;

                }




                resolve(

                    String(

                        data.value ?? "",

                    ),

                );


            }





            workerScope.addEventListener(

                "message",

                onMessage,

            );





            send({

                type:

                    "stdin-request",


                requestId,


                prompt,

            });



        },

    );

}


/* ============================================================================
 * Python Transformer
 * ========================================================================== */

const pythonTransformer = `

import ast


class RuntimeTransformer(ast.NodeTransformer):


    def visit_Call(self, node):

        self.generic_visit(node)


        if isinstance(node.func, ast.Name):


            # ================================================================
            # print()
            # ================================================================

            if node.func.id == "print":


                values = ast.List(

                    elts=node.args,

                    ctx=ast.Load()

                )


                replacement = ast.Call(

                    func=ast.Attribute(

                        value=ast.Name(

                            id="runtime",

                            ctx=ast.Load()

                        ),

                        attr="writeOut",

                        ctx=ast.Load()

                    ),


                    args=[


                        ast.Call(

                            func=ast.Attribute(

                                value=ast.Constant(

                                    value=" "

                                ),

                                attr="join",

                                ctx=ast.Load()

                            ),


                            args=[


                                ast.GeneratorExp(

                                    elt=ast.Call(

                                        func=ast.Name(

                                            id="str",

                                            ctx=ast.Load()

                                        ),

                                        args=[

                                            ast.Name(

                                                id="value",

                                                ctx=ast.Load()

                                            )

                                        ],

                                        keywords=[]

                                    ),


                                    generators=[


                                        ast.comprehension(

                                            target=ast.Name(

                                                id="value",

                                                ctx=ast.Store()

                                            ),

                                            iter=values,

                                            ifs=[],

                                            is_async=0

                                        )


                                    ]

                                )


                            ],


                            keywords=[]

                        )


                    ],


                    keywords=[]

                )


                return ast.copy_location(

                    replacement,

                    node

                )




            # ================================================================
            # input()
            # ================================================================

            if node.func.id == "input":


                prompt = (

                    node.args[0]

                    if node.args

                    else ast.Constant(

                        value=""

                    )

                )



                replacement = ast.Await(

                    value=ast.Call(

                        func=ast.Attribute(

                            value=ast.Name(

                                id="runtime",

                                ctx=ast.Load()

                            ),

                            attr="writeIn",

                            ctx=ast.Load()

                        ),


                        args=[

                            prompt

                        ],


                        keywords=[]

                    )

                )


                return ast.copy_location(

                    replacement,

                    node

                )



        return node





tree = ast.parse(

    USER_CODE,

    filename="<user_code>"

)



tree = RuntimeTransformer().visit(tree)



async_function = ast.AsyncFunctionDef(

    name="__user_program__",


    args=ast.arguments(

        posonlyargs=[],

        args=[],

        kwonlyargs=[],

        kw_defaults=[],

        defaults=[],

    ),


    body=tree.body,


    decorator_list=[],

)



module = ast.Module(

    body=[

        async_function

    ],


    type_ignores=[],

)



ast.fix_missing_locations(

    module

)



exec(

    compile(

        module,

        "<user_code>",

        "exec"

    )

)



await __user_program__()

`;


/* ============================================================================
 * Python Execution Engine
 * ========================================================================== */

async function runPython(

    code: string,

): Promise<void> {


    cancelled = false;



    try {


        /*
         * Load cached Pyodide instance.
         */

        const py =

            await getPyodide();





        /*
         * Configure stdout.
         */

        py.setStdout({

            batched(

                text: string,

            ) {


                if (cancelled) {

                    return;

                }



                send({

                    type:

                        "writeOut",


                    text,

                });


            },


        });





        /*
         * Configure stderr.
         */

        py.setStderr({

            batched(

                text: string,

            ) {


                if (cancelled) {

                    return;

                }



                send({

                    type:

                        "writeErr",


                    text,

                });


            },


        });






        /*
         * Notify main thread.
         */

        send({

            type:

                "ready",

        });






        /*
         * JavaScript bridge for input().
         */

        const runtimeInput = async (

            prompt: string = "",

        ): Promise<string> => {


            if (cancelled) {

                throw new Error(

                    "Runtime cancelled.",

                );

            }



            return requestInput(

                String(prompt),

            );


        };






        /*
         * Expose runtime APIs to Python.
         */

        py.globals.set(

            "runtime",

            {


                writeOut(

                    text: string,

                    color?: string,

                ) {


                    if (cancelled) {

                        return;

                    }



                    send({

                        type:

                            "writeOut",


                        text,


                        color,

                    });


                },





                writeErr(

                    text: string,

                ) {


                    if (cancelled) {

                        return;

                    }



                    send({

                        type:

                            "writeErr",


                        text,

                    });


                },





                writeIn:

                    runtimeInput,


            },

        );







        /*
         * Expose student code.
         */

        py.globals.set(

            "USER_CODE",

            code,

        );






        /*
         * Execute transformer.
         */

        await py.runPythonAsync(

            pythonTransformer,

        );







        /*
         * Finished successfully.
         */

        if (!cancelled) {


            send({

                type:

                    "done",

            });


        }



    } catch (

        error: any

    ) {


        if (cancelled) {

            return;

        }



        send({

            type:

                "error",



            message:

                error?.message ??
                String(error),


        });


    }


}


/* ============================================================================
 * Worker Message Handler
 * ========================================================================== */

workerScope.onmessage = (

    event: MessageEvent,

) => {


    const data =

        event.data;



    if (!data) {

        return;

    }




    switch (

        data.type

    ) {



        /* ================================================================
         * Run Python program
         * ================================================================ */

        case "run":


            runPython(

                data.code ?? "",

            );


            break;





        /* ================================================================
         * stdin result
         *
         * These messages are handled by
         * requestInput() temporary listeners.
         * ================================================================ */

        case "stdin-result":


            break;





        /* ================================================================
         * stdin cancelled
         *
         * These messages are handled by
         * requestInput() temporary listeners.
         * ================================================================ */

        case "stdin-cancel":


            break;





        /* ================================================================
         * Cancel execution
         * ================================================================ */

        case "cancel":


            cancelled = true;


            break;


    }


};