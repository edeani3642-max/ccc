import runtime from "@/lib/runtime/RunTime";

declare global {
    interface Window {
        loadPyodide?: (options: {
            indexURL: string;
        }) => Promise<any>;
    }
}

let pyodide: any = null;

let pyodideScriptPromise: Promise<void> | null = null;


async function loadPyodideScript(): Promise<void> {
    if (window.loadPyodide) {
        return;
    }

    if (pyodideScriptPromise) {
        return pyodideScriptPromise;
    }

    pyodideScriptPromise = new Promise(
        (resolve, reject) => {
            const script =
                document.createElement("script");

            script.src = "/pyodide/pyodide.js";

            script.onload = () => resolve();

            script.onerror = () =>
                reject(
                    new Error(
                        "Failed to load local Pyodide script.",
                    ),
                );

            document.head.appendChild(script);
        },
    );

    return pyodideScriptPromise;
}


const pythonTransformer = `
import ast


class RuntimeTransformer(ast.NodeTransformer):

    def visit_Call(self, node):
        self.generic_visit(node)

        if isinstance(node.func, ast.Name):

            # -----------------------------
            # print()
            # -----------------------------

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
                        ),
                    ],
                    keywords=[]
                )

                return ast.copy_location(
                    replacement,
                    node
                )


            # -----------------------------
            # input()
            # -----------------------------

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
        async_function,
    ],
    type_ignores=[],
)


ast.fix_missing_locations(module)


exec(
    compile(
        module,
        "<user_code>",
        "exec",
    )
)


await __user_program__()
`;


export async function runPython(
    code: string,
): Promise<void> {

    runtime.open("Python Runtime");

    runtime.clear();

    runtime.writeOut(
        "[System] Initializing Python Runtime...",
        "90",
    );


    try {

        if (!pyodide) {

            await loadPyodideScript();

            if (!window.loadPyodide) {
                throw new Error(
                    "Pyodide failed to initialize.",
                );
            }

            pyodide =
                await window.loadPyodide({
                    indexURL: "/pyodide/",
                });
        }


        runtime.writeOut(
            "[System] Done",
            "90",
        );


        pyodide.globals.set(
            "runtime",
            runtime,
        );


        pyodide.globals.set(
            "USER_CODE",
            code,
        );


        await pyodide.runPythonAsync(
            pythonTransformer,
        );


        runtime.writeOut(
            "[System] Program Finished",
            "90",
        );


    } catch (error) {

        runtime.writeErr(
            "[Runtime Error]",
        );


        if (error instanceof Error) {
            runtime.writeErr(
                `${error.message}`,
            );
        }
        else {
            runtime.writeErr(
                `${String(error)}`,
            );
        }


        runtime.writeErr(
            "[System] Program Failed",
        );
    }
}