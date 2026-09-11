"use client";

import {
    use,
    useEffect,
    useRef,
    useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

type PageProps = {
    params: Promise<{
        language: string;
    }>;
};

type Files = Record<string, string>;

const languageNames: Record<string, string> = {
    python: "Python",
};

const languageExtensions: Record<string, string> = {
    python: ".py",
};

const languageIcons: Record<string, string> = {
    python: "/python.png",
};

const defaultFiles: Record<string, Files> = {
    python: {
        "main.py": "",
    },
};

export default function LanguageIDEPage({
    params,
}: PageProps) {
    const router = useRouter();

    const {
        language: languageParam,
    } = use(params);

    const language =
        languageParam.toLowerCase();

    const languageName =
        languageNames[language];

    const extension =
        languageExtensions[language];

    const languageIcon =
        languageIcons[language];

    const storageKey =
        `campuscodecamp:ide:${language}`;

    const [files, setFiles] =
        useState<Files>({});

    const [ready, setReady] =
        useState(false);

    const [showCreate, setShowCreate] =
        useState(false);

    const [newFilename, setNewFilename] =
        useState("");

    const [contextFile, setContextFile] =
        useState<string | null>(null);

    const [renameFile, setRenameFile] =
        useState<string | null>(null);

    const [renameValue, setRenameValue] =
        useState("");

    const longPressTimer =
        useRef<ReturnType<typeof setTimeout> | null>(
            null,
        );

    useEffect(() => {
        if (!languageName) {
            return;
        }

        const stored =
            localStorage.getItem(storageKey);

        if (stored) {
            try {
                const parsed =
                    JSON.parse(stored);

                if (
                    parsed &&
                    typeof parsed === "object" &&
                    !Array.isArray(parsed)
                ) {
                    setFiles(parsed);
                    setReady(true);
                    return;
                }
            } catch {
                // Ignore invalid local data.
            }
        }

        const initial =
            defaultFiles[language] ?? {};

        setFiles(initial);

        localStorage.setItem(
            storageKey,
            JSON.stringify(initial),
        );

        setReady(true);
    }, [
        language,
        languageName,
        storageKey,
    ]);

    const saveFiles = (
        nextFiles: Files,
    ) => {
        setFiles(nextFiles);

        localStorage.setItem(
            storageKey,
            JSON.stringify(nextFiles),
        );
    };

    const normalizeFilename = (
        value: string,
    ) => {
        let name =
            value.trim();

        if (!name) {
            return "";
        }

        if (
            extension &&
            name.toLowerCase().endsWith(extension)
        ) {
            name =
                name.slice(
                    0,
                    -extension.length,
                );
        }

        name =
            name.replace(
                /[\\/:*?"<>|]/g,
                "",
            );

        if (!name) {
            return "";
        }

        return `${name}${extension}`;
    };

    const createFile = () => {
        const filename =
            normalizeFilename(
                newFilename,
            );

        if (!filename) {
            return;
        }

        if (
            Object.prototype.hasOwnProperty.call(
                files,
                filename,
            )
        ) {
            return;
        }

        saveFiles({
            ...files,
            [filename]: "",
        });

        setNewFilename("");
        setShowCreate(false);
    };

    const deleteFile = (
        filename: string,
    ) => {
        const nextFiles = {
            ...files,
        };

        delete nextFiles[filename];

        saveFiles(nextFiles);
        setContextFile(null);
    };

    const startRename = (
        filename: string,
    ) => {
        const withoutExtension =
            extension &&
            filename.toLowerCase().endsWith(extension)
                ? filename.slice(
                      0,
                      -extension.length,
                  )
                : filename;

        setRenameFile(filename);
        setRenameValue(
            withoutExtension,
        );
        setContextFile(null);
    };

    const rename = () => {
        if (!renameFile) {
            return;
        }

        const filename =
            normalizeFilename(
                renameValue,
            );

        if (
            !filename ||
            filename === renameFile
        ) {
            setRenameFile(null);
            return;
        }

        if (
            Object.prototype.hasOwnProperty.call(
                files,
                filename,
            )
        ) {
            return;
        }

        const nextFiles = {
            ...files,
        };

        nextFiles[filename] =
            nextFiles[renameFile];

        delete nextFiles[renameFile];

        saveFiles(nextFiles);

        setRenameFile(null);
        setRenameValue("");
    };

    const exportFile = (
        filename: string,
    ) => {
        const content =
            files[filename] ?? "";

        const blob =
            new Blob(
                [content],
                {
                    type:
                        "text/plain;charset=utf-8",
                },
            );

        const url =
            URL.createObjectURL(blob);

        const anchor =
            document.createElement("a");

        anchor.href = url;
        anchor.download = filename;
        anchor.click();

        URL.revokeObjectURL(url);

        setContextFile(null);
    };

    const openFile = (
        filename: string,
    ) => {
        router.push(
            `/ide/${language}/${encodeURIComponent(
                filename,
            )}`,
        );
    };

    const startLongPress = (
        filename: string,
    ) => {
        cancelLongPress();

        longPressTimer.current =
            setTimeout(() => {
                setContextFile(filename);
            }, 550);
    };

    const cancelLongPress = () => {
        if (longPressTimer.current) {
            clearTimeout(
                longPressTimer.current,
            );

            longPressTimer.current = null;
        }
    };

    if (!languageName) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[#0d1117] text-[#e6edf3]">
                <div className="px-6 text-center">
                    <h1 className="text-lg font-medium">
                        Language not supported
                    </h1>

                    <p className="mt-2 text-sm text-[#8b949e]">
                        This language is not currently available.
                    </p>

                    <Link
                        href="/ide"
                        className="
                            mt-6
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
                        Back to languages
                    </Link>
                </div>
            </main>
        );
    }

    const fileNames =
        Object.keys(files);

    return (
        <main
            className="
                min-h-screen
                bg-[#0d1117]
                text-[#e6edf3]
            "
            onPointerDown={(event) => {
                const target =
                    event.target as HTMLElement;

                if (
                    !target.closest(
                        "[data-file-menu]",
                    )
                ) {
                    setContextFile(null);
                }
            }}
        >
            <header
                className="
                    sticky
                    top-0
                    z-30
                    flex
                    h-14
                    items-center
                    justify-between
                    border-b
                    border-[#30363d]
                    bg-[#161b22]
                    px-3
                "
            >
                <div className="flex min-w-0 items-center">
                    <Link
                        href="/ide"
                        aria-label="Back"
                        className="
                            flex
                            h-9
                            w-9
                            shrink-0
                            items-center
                            justify-center
                            text-xl
                            text-[#8b949e]
                            transition-colors
                            hover:bg-[#21262d]
                            hover:text-[#e6edf3]
                        "
                    >
                        ←
                    </Link>

                    <div className="ml-2 min-w-0">
                        <div className="truncate text-sm font-medium text-[#e6edf3]">
                            {languageName}
                        </div>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => {
                        setContextFile(null);
                        setShowCreate(true);
                    }}
                    aria-label="Create new file"
                    className="
                        flex
                        h-9
                        w-9
                        shrink-0
                        items-center
                        justify-center
                        border
                        border-[#30363d]
                        bg-[#21262d]
                        text-xl
                        leading-none
                        text-[#c9d1d9]
                        transition-colors
                        hover:bg-[#30363d]
                        hover:text-white
                    "
                >
                    +
                </button>
            </header>

            <section className="mx-auto w-full max-w-3xl">
                <div
                    className="
                        flex
                        h-11
                        items-center
                        border-b
                        border-[#30363d]
                        px-4
                        text-xs
                        font-medium
                        uppercase
                        tracking-wider
                        text-[#8b949e]
                    "
                >
                    Your files
                </div>

                {!ready ? (
                    <div className="px-4 py-8 text-sm text-[#8b949e]">
                        Loading files...
                    </div>
                ) : fileNames.length === 0 ? (
                    <div className="flex flex-col items-center px-6 py-16 text-center">
                        {languageIcon && (
                            <img
                                src={languageIcon}
                                alt=""
                                className="
                                    h-12
                                    w-12
                                    object-contain
                                    opacity-70
                                "
                            />
                        )}

                        <p className="mt-4 text-sm text-[#c9d1d9]">
                            No files yet
                        </p>

                        <p className="mt-1 text-xs text-[#8b949e]">
                            Create a {extension} file to get started.
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                                setShowCreate(true)
                            }
                            className="
                                mt-5
                                h-9
                                border
                                border-[#30363d]
                                bg-[#21262d]
                                px-4
                                text-sm
                                text-[#c9d1d9]
                                hover:bg-[#30363d]
                            "
                        >
                            New file
                        </button>
                    </div>
                ) : (
                    <div>
                        {fileNames.map(
                            (filename) => (
                                <div
                                    key={filename}
                                    data-file-menu
                                    className="
                                        relative
                                        border-b
                                        border-[#21262d]
                                    "
                                    onPointerDown={() =>
                                        startLongPress(
                                            filename,
                                        )
                                    }
                                    onPointerUp={
                                        cancelLongPress
                                    }
                                    onPointerLeave={
                                        cancelLongPress
                                    }
                                    onPointerCancel={
                                        cancelLongPress
                                    }
                                    onContextMenu={(
                                        event,
                                    ) => {
                                        event.preventDefault();
                                        cancelLongPress();
                                        setContextFile(
                                            filename,
                                        );
                                    }}
                                >
                                    <button
                                        type="button"
                                        onClick={() =>
                                            openFile(
                                                filename,
                                            )
                                        }
                                        className="
                                            flex
                                            min-h-16
                                            w-full
                                            items-center
                                            gap-3
                                            px-4
                                            text-left
                                            transition-colors
                                            hover:bg-[#161b22]
                                            active:bg-[#21262d]
                                        "
                                    >
                                        <div
                                            className="
                                                flex
                                                h-9
                                                w-9
                                                shrink-0
                                                items-center
                                                justify-center
                                            "
                                        >
                                            {languageIcon && (
                                                <img
                                                    src={
                                                        languageIcon
                                                    }
                                                    alt=""
                                                    className="
                                                        h-7
                                                        w-7
                                                        object-contain
                                                    "
                                                />
                                            )}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-sm text-[#e6edf3]">
                                                {filename}
                                            </div>

                                            <div className="mt-0.5 text-[11px] text-[#6e7681]">
                                                {extension}
                                            </div>
                                        </div>

                                        <span className="text-xs text-[#484f58]">
                                            ›
                                        </span>
                                    </button>

                                    {contextFile ===
                                        filename && (
                                        <div
                                            className="
                                                absolute
                                                right-3
                                                top-14
                                                z-40
                                                w-40
                                                overflow-hidden
                                                border
                                                border-[#30363d]
                                                bg-[#161b22]
                                                shadow-2xl
                                            "
                                        >
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    startRename(
                                                        filename,
                                                    )
                                                }
                                                className="
                                                    flex
                                                    h-11
                                                    w-full
                                                    items-center
                                                    px-4
                                                    text-left
                                                    text-sm
                                                    text-[#c9d1d9]
                                                    hover:bg-[#21262d]
                                                "
                                            >
                                                Rename
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    exportFile(
                                                        filename,
                                                    )
                                                }
                                                className="
                                                    flex
                                                    h-11
                                                    w-full
                                                    items-center
                                                    px-4
                                                    text-left
                                                    text-sm
                                                    text-[#c9d1d9]
                                                    hover:bg-[#21262d]
                                                "
                                            >
                                                Export
                                            </button>

                                            <div className="border-t border-[#30363d]" />

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    deleteFile(
                                                        filename,
                                                    )
                                                }
                                                className="
                                                    flex
                                                    h-11
                                                    w-full
                                                    items-center
                                                    px-4
                                                    text-left
                                                    text-sm
                                                    text-[#f85149]
                                                    hover:bg-[#21262d]
                                                "
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ),
                        )}
                    </div>
                )}
            </section>

            {showCreate && (
                <div
                    className="
                        fixed
                        inset-0
                        z-50
                        flex
                        items-center
                        justify-center
                        bg-black/70
                        px-4
                    "
                    onClick={() =>
                        setShowCreate(false)
                    }
                >
                    <div
                        className="
                            w-full
                            max-w-sm
                            border
                            border-[#30363d]
                            bg-[#161b22]
                            shadow-2xl
                        "
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >
                        <div
                            className="
                                flex
                                items-center
                                gap-3
                                border-b
                                border-[#30363d]
                                px-4
                                py-4
                            "
                        >
                            {languageIcon && (
                                <img
                                    src={languageIcon}
                                    alt=""
                                    className="h-7 w-7 object-contain"
                                />
                            )}

                            <div>
                                <h2 className="text-sm font-medium text-[#e6edf3]">
                                    New {languageName} file
                                </h2>

                                <p className="mt-0.5 text-xs text-[#8b949e]">
                                    Choose a filename
                                </p>
                            </div>
                        </div>

                        <div className="p-4">
                            <div
                                className="
                                    flex
                                    h-10
                                    border
                                    border-[#30363d]
                                    bg-[#0d1117]
                                    focus-within:border-[#58a6ff]
                                "
                            >
                                <input
                                    autoFocus
                                    value={newFilename}
                                    onChange={(event) =>
                                        setNewFilename(
                                            event.target.value,
                                        )
                                    }
                                    onKeyDown={(event) => {
                                        if (
                                            event.key ===
                                            "Enter"
                                        ) {
                                            createFile();
                                        }

                                        if (
                                            event.key ===
                                            "Escape"
                                        ) {
                                            setShowCreate(
                                                false,
                                            );
                                        }
                                    }}
                                    placeholder="filename"
                                    className="
                                        min-w-0
                                        flex-1
                                        bg-transparent
                                        px-3
                                        text-sm
                                        text-[#e6edf3]
                                        outline-none
                                    "
                                />

                                <div
                                    className="
                                        flex
                                        shrink-0
                                        items-center
                                        border-l
                                        border-[#30363d]
                                        px-3
                                        text-sm
                                        text-[#8b949e]
                                    "
                                >
                                    {extension}
                                </div>
                            </div>

                            <div className="mt-4 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowCreate(
                                            false,
                                        )
                                    }
                                    className="
                                        h-9
                                        border
                                        border-[#30363d]
                                        px-4
                                        text-sm
                                        text-[#8b949e]
                                        hover:bg-[#21262d]
                                        hover:text-[#e6edf3]
                                    "
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={createFile}
                                    className="
                                        h-9
                                        border
                                        border-[#30363d]
                                        bg-[#21262d]
                                        px-4
                                        text-sm
                                        text-[#e6edf3]
                                        hover:bg-[#30363d]
                                    "
                                >
                                    Create
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {renameFile && (
                <div
                    className="
                        fixed
                        inset-0
                        z-50
                        flex
                        items-center
                        justify-center
                        bg-black/70
                        px-4
                    "
                    onClick={() =>
                        setRenameFile(null)
                    }
                >
                    <div
                        className="
                            w-full
                            max-w-sm
                            border
                            border-[#30363d]
                            bg-[#161b22]
                            shadow-2xl
                        "
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >
                        <div
                            className="
                                border-b
                                border-[#30363d]
                                px-4
                                py-4
                            "
                        >
                            <h2 className="text-sm font-medium text-[#e6edf3]">
                                Rename file
                            </h2>

                            <p className="mt-0.5 text-xs text-[#8b949e]">
                                The file extension cannot be changed.
                            </p>
                        </div>

                        <div className="p-4">
                            <div
                                className="
                                    flex
                                    h-10
                                    border
                                    border-[#30363d]
                                    bg-[#0d1117]
                                    focus-within:border-[#58a6ff]
                                "
                            >
                                <input
                                    autoFocus
                                    value={renameValue}
                                    onChange={(event) =>
                                        setRenameValue(
                                            event.target.value,
                                        )
                                    }
                                    onKeyDown={(event) => {
                                        if (
                                            event.key ===
                                            "Enter"
                                        ) {
                                            rename();
                                        }

                                        if (
                                            event.key ===
                                            "Escape"
                                        ) {
                                            setRenameFile(
                                                null,
                                            );
                                        }
                                    }}
                                    className="
                                        min-w-0
                                        flex-1
                                        bg-transparent
                                        px-3
                                        text-sm
                                        text-[#e6edf3]
                                        outline-none
                                    "
                                />

                                <div
                                    className="
                                        flex
                                        shrink-0
                                        items-center
                                        border-l
                                        border-[#30363d]
                                        px-3
                                        text-sm
                                        text-[#8b949e]
                                    "
                                >
                                    {extension}
                                </div>
                            </div>

                            <div className="mt-4 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setRenameFile(
                                            null,
                                        )
                                    }
                                    className="
                                        h-9
                                        border
                                        border-[#30363d]
                                        px-4
                                        text-sm
                                        text-[#8b949e]
                                        hover:bg-[#21262d]
                                        hover:text-[#e6edf3]
                                    "
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={rename}
                                    className="
                                        h-9
                                        border
                                        border-[#30363d]
                                        bg-[#21262d]
                                        px-4
                                        text-sm
                                        text-[#e6edf3]
                                        hover:bg-[#30363d]
                                    "
                                >
                                    Rename
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

