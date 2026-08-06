"use client";

import { useMemo } from "react";

import CodeMirror from "@uiw/react-codemirror";

import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { html } from "@codemirror/lang-html";
import { githubDark } from "@uiw/codemirror-theme-github";

export type EditorLanguage =
    | "javascript"
    | "python"
    | "html";

interface CodeMirrorEditorProps {
    language: EditorLanguage;
    editable: boolean;
    value: string;
    onChange?: (value: string) => void;
}

export default function CodeMirrorEditor({
    language,
    editable,
    value,
    onChange,
}: CodeMirrorEditorProps) {
    const extensions = useMemo(() => {
        switch (language) {
            case "javascript":
                return [
                    javascript({
                        jsx: true,
                        typescript: true,
                    }),
                ];

            case "python":
                return [
                    python(),
                ];

            case "html":
                return [
                    html(),
                ];

            default:
                return [];
        }
    }, [language]);

    return (
        <CodeMirror
            value={value}
            theme={githubDark}
            extensions={extensions}
            editable={editable}
            basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                highlightActiveLine: true,
                highlightActiveLineGutter: true,
            }}
            onChange={(value) => {
                onChange?.(value);
            }}
            style={{
                width: "100%",
                height: "100%",
            }}
        />
    );
}