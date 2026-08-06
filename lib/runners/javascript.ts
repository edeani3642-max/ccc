import runtime from "@/lib/runtime/RunTime";

export async function runJavascript(
    code: string,
): Promise<void> {
    runtime.open("JavaScript Runtime");

    runtime.clear();

    runtime.writeOut(
        "[System] Initializing JavaScript Runtime...",
        "90",
    );

    try {
        // ---------------------------------
        // Transformer
        // ---------------------------------

        const transformCall = (
            source: string,
            target: string,
            replacement: (
                args: string,
            ) => string,
        ) => {
            let result = "";
            let index = 0;

            while (index < source.length) {
                const start = source.indexOf(
                    target,
                    index,
                );

                if (start === -1) {
                    result += source.slice(index);
                    break;
                }

                result += source.slice(
                    index,
                    start,
                );

                const argsStart =
                    start + target.length;

                let depth = 1;
                let i = argsStart;

                while (
                    i < source.length &&
                    depth > 0
                ) {
                    const char = source[i];

                    switch (char) {
                        case "(":
                            depth++;
                            break;

                        case ")":
                            depth--;
                            break;

                        case '"':
                        case "'":
                        case "`": {
                            const quote = char;

                            i++;

                            while (
                                i < source.length
                            ) {
                                if (
                                    source[i] === "\\"
                                ) {
                                    i += 2;
                                    continue;
                                }

                                if (
                                    source[i] === quote
                                ) {
                                    break;
                                }

                                i++;
                            }

                            break;
                        }
                    }

                    i++;
                }

                const args = source.slice(
                    argsStart,
                    i - 1,
                );

                let end = i;

                while (
                    end < source.length &&
                    /\s/.test(source[end])
                ) {
                    end++;
                }

                if (
                    source[end] === ";"
                ) {
                    end++;
                }

                result += replacement(
                    args,
                );

                if (
                    source[end - 1] === ";"
                ) {
                    result += ";";
                }

                index = end;
            }

            return result;
        };


        code = transformCall(
            code,
            "console.log(",
            (args) =>
                `(runtime.writeOut([${args}].join(" ")), undefined)`,
        );


        code = transformCall(
            code,
            "console.error(",
            (args) =>
                `(runtime.writeErr([${args}].join(" ")), undefined)`,
        );


        runtime.writeOut(
            "[System] Done",
            "90",
        );


        // ---------------------------------
        // Engine
        // ---------------------------------

        const execute = new Function(
            "runtime",
            code,
        );


        await Promise.resolve(
            execute(runtime),
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