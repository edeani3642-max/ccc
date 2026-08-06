"use client";

import { useState } from "react";
import { runPython } from "@/lib/runners/python";
import { runJavascript } from "@/lib/runners/javascript";

import CodeMirrorEditor, {
    type EditorLanguage,
} from "./CodeMirrorEditor";

interface CodeBlockProps {
    value: string;
    language: EditorLanguage;
}

export default function CodeBlock({
    value,
    language,
}: CodeBlockProps) {
    const [code, setCode] = useState(value);

    return (
        <div className="flex h-auto w-full flex-col overflow-hidden rounded-lg border border-zinc-700 bg-zinc-950">
            <div className="flex items-center justify-between border-b border-zinc-700 bg-zinc-900 px-4 py-1">
                <span className="text-sm font-semibold capitalize text-zinc-200">
                    {language}
                </span>

                <button
                    onClick={() => {
                        switch (language) {
                            case "javascript":
                                runJavascript(code);
                                break;

                            case "python":
                                runPython(code);
                                break;

                            default:
                                console.log(
                                    `Runtime for ${language} is not implemented yet.`,
                                );
                        }
                    }}
                    className="rounded-md bg-green-600 px-4 py-1 font-semibold text-white transition-colors hover:bg-green-700"
                >
                    Run
                </button>
            </div>

            <div className="min-h-0 flex-1">
                <CodeMirrorEditor
                    language={language}
                    value={code}
                    editable={true}
                    onChange={setCode}
                />
            </div>
        </div>
    );
}