"use client";

import {
    useEffect,
    useRef,
} from "react";

import CodeMirror from "@uiw/react-codemirror";

import {
    javascript,
} from "@codemirror/lang-javascript";

import {
    python,
} from "@codemirror/lang-python";

import {
    html,
} from "@codemirror/lang-html";

import {
    githubDark,
} from "@uiw/codemirror-theme-github";

export type EditorLanguage =
    | "javascript"
    | "python"
    | "html";

type CodeMirrorEditorProps = {
    language: EditorLanguage;
    editable?: boolean;
    value: string;
    onChange?: (value: string) => void;
};

export default function CodeMirrorEditor({
    language,
    editable = true,
    value,
    onChange,
}: CodeMirrorEditorProps) {
    const editorRef =
        useRef<HTMLDivElement>(null);

    const extensions = (() => {
        switch (language) {
            case "python":
                return [python()];

            case "html":
                return [html()];

            case "javascript":
            default:
                return [javascript()];
        }
    })();

    useEffect(() => {
        const editor =
            editorRef.current;

        if (!editor) {
            return;
        }

        const cmEditor =
            editor.querySelector(
                ".cm-editor",
            ) as HTMLElement | null;

        const scroller =
            editor.querySelector(
                ".cm-scroller",
            ) as HTMLElement | null;

        if (cmEditor) {
            cmEditor.style.height = "100%";
        }

        if (scroller) {
            scroller.style.height = "100%";
            scroller.style.overflow = "auto";
        }
    }, []);

    return (
        <div
            ref={editorRef}
            className="
                h-full
                min-h-0
                w-full
                overflow-hidden
            "
        >
            <CodeMirror
                value={value}
                height="100%"
                minHeight="100%"
                extensions={extensions}
                editable={editable}
                onChange={onChange}
                theme={githubDark}
                basicSetup={{
                    lineNumbers: true,
                    foldGutter: true,
                    dropCursor: true,
                    allowMultipleSelections: true,
                    indentOnInput: true,
                    bracketMatching: true,
                    closeBrackets: true,
                    autocompletion: true,
                    rectangularSelection: true,
                    highlightSelectionMatches: true,
                    closeBracketsKeymap: true,
                    searchKeymap: true,
                    foldKeymap: true,
                    completionKeymap: true,
                }}
                className="
                    h-full
                    min-h-0
                    w-full
                "
                style={{
                    height: "100%",
                }}
            />
        </div>
    );
}