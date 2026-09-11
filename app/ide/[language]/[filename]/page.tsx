"use client";

import {
    use,
    useEffect,
    useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import CodeMirrorEditor from "@/components/editor/CodeMirrorEditor";

import {
    runPython,
} from "@/lib/runners/python";

type PageProps = {
    params: Promise<{
        language: string;
        filename: string;
    }>;
};

type Files = Record<string, string>;

const languageNames: Record<string, string> = {
    python: "Python",
};

const languageIcons: Record<string, string> = {
    python: "/python.png",
};

export default function EditorPage({
    params,
}: PageProps) {
    const router = useRouter();

    const {
        language: languageParam,
        filename: filenameParam,
    } = use(params);

    const language =
        languageParam.toLowerCase();

    const filename =
        decodeURIComponent(filenameParam);

    const languageName =
        languageNames[language];

    const languageIcon =
        languageIcons[language];

    const storageKey =
        `campuscodecamp:ide:${language}`;

    const [code, setCode] =
        useState("");

    const [ready, setReady] =
        useState(false);

    useEffect(() => {
        if (!languageName) {
            return;
        }

        const stored =
            localStorage.getItem(storageKey);

        if (!stored) {
            router.replace(
                `/ide/${language}`,
            );
            return;
        }

        try {
            const files =
                JSON.parse(stored) as Files;

            if (
                !Object.prototype.hasOwnProperty.call(
                    files,
                    filename,
                )
            ) {
                router.replace(
                    `/ide/${language}`,
                );
                return;
            }

            setCode(
                typeof files[filename] ===
                    "string"
                    ? files[filename]
                    : "",
            );

            setReady(true);
        } catch {
            router.replace(
                `/ide/${language}`,
            );
        }
    }, [
        filename,
        language,
        languageName,
        router,
        storageKey,
    ]);

    const handleChange = (
        value: string,
    ) => {
        setCode(value);

        const stored =
            localStorage.getItem(
                storageKey,
            );

        if (!stored) {
            return;
        }

        try {
            const files =
                JSON.parse(stored) as Files;

            files[filename] = value;

            localStorage.setItem(
                storageKey,
                JSON.stringify(files),
            );
        } catch {
            // Ignore storage errors.
        }
    };

    const runCode = async () => {
        if (language === "python") {
            await runPython(code);
        }
    };

    if (!languageName) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[#0d1117] text-[#e6edf3]">
                <div className="text-center">
                    <h1 className="text-lg font-medium">
                        Language not supported
                    </h1>

                    <Link
                        href="/ide"
                        className="
                            mt-5
                            inline-flex
                            h-9
                            items-center
                            border
                            border-[#30363d]
                            px-4
                            text-sm
                            text-[#c9d1d9]
                            transition-colors
                            hover:bg-[#161b22]
                            hover:text-[#e6edf3]
                        "
                    >
                        Back to IDE
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main
            className="
                flex
                h-dvh
                flex-col
                overflow-hidden
                bg-[#0d1117]
                text-[#e6edf3]
            "
        >
            {/* Editor tab bar */}
            <header
                className="
                    flex
                    h-12
                    shrink-0
                    items-stretch
                    border-b
                    border-[#30363d]
                    bg-[#161b22]
                "
            >
                {/* Back */}
                <button
                    type="button"
                    onClick={() =>
                        router.push(
                            `/ide/${language}`,
                        )
                    }
                    aria-label="Back to files"
                    className="
                        flex
                        h-12
                        w-11
                        shrink-0
                        items-center
                        justify-center
                        border-r
                        border-[#30363d]
                        text-lg
                        text-[#8b949e]
                        transition-colors
                        hover:bg-[#21262d]
                        hover:text-[#e6edf3]
                    "
                >
                    ←
                </button>

                {/* Active file tab */}
                <div
                    className="
                        relative
                        flex
                        h-12
                        min-w-0
                        max-w-[70vw]
                        items-center
                        gap-2
                        border-r
                        border-[#30363d]
                        bg-[#0d1117]
                        px-4
                    "
                >
                    <span
                        className="
                            absolute
                            bottom-0
                            left-0
                            right-0
                            h-px
                            bg-[#e6edf3]
                        "
                    />

                    {languageIcon && (
                        <img
                            src={languageIcon}
                            alt=""
                            className="
                                h-4
                                w-4
                                shrink-0
                                object-contain
                            "
                        />
                    )}

                    <span
                        className="
                            min-w-0
                            truncate
                            text-sm
                            text-[#e6edf3]
                        "
                    >
                        {filename}
                    </span>
                </div>

                {/* Spacer */}
                <div className="min-w-0 flex-1" />

                {/* Run */}
                <button
                    type="button"
                    onClick={runCode}
                    disabled={!ready}
                    aria-label="Run"
                    className="
                        my-2
                        mr-2
                        flex
                        h-8
                        w-9
                        shrink-0
                        items-center
                        justify-center
                        border
                        border-[#30363d]
                        bg-[#21262d]
                        text-sm
                        text-[#e6edf3]
                        transition-colors
                        hover:bg-[#30363d]
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                    "
                >
                    ▶
                </button>
            </header>

            {/* Editor */}
            <section
                className="
                    min-h-0
                    flex-1
                    overflow-hidden
                "
            >
                {ready && (
                    <div className="h-full w-full">
                        <CodeMirrorEditor
                            language={
                                language === "python"
                                    ? "python"
                                    : "javascript"
                            }
                            editable={true}
                            value={code}
                            onChange={handleChange}
                        />
                    </div>
                )}
            </section>
        </main>
    );
}
