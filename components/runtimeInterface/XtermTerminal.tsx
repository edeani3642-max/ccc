"use client";

import "@xterm/xterm/css/xterm.css";

import {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useRef,
} from "react";

import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";

import type { Terminal } from "@/lib/terminal/types";

const XtermTerminal = forwardRef<Terminal>((_, ref) => {
    const containerRef =
        useRef<HTMLDivElement>(null);

    const terminalRef =
        useRef<XTerm | null>(null);

    const fitAddonRef =
        useRef<FitAddon | null>(null);

    const cancelInputRef =
        useRef<(() => void) | null>(null);

    useImperativeHandle(
        ref,
        () => ({
            /* ------------------------------------------------------------------ */
            /* stdout                                                             */
            /* ------------------------------------------------------------------ */

            writeOut(
                stdOut: string,
                color?: string,
            ) {
                const terminal =
                    terminalRef.current;

                if (!terminal) {
                    return;
                }

                if (color) {
                    terminal.write(
                        `\x1b[${color}m${stdOut}\x1b[0m`,
                    );

                    return;
                }

                terminal.write(
                    stdOut,
                );
            },

            /* ------------------------------------------------------------------ */
            /* stderr                                                             */
            /* ------------------------------------------------------------------ */

            writeErr(
                stdErr: string,
            ) {
                const terminal =
                    terminalRef.current;

                if (!terminal) {
                    return;
                }

                terminal.write(
                    `\x1b[31m${stdErr}\x1b[0m`,
                );
            },

            /* ------------------------------------------------------------------ */
            /* clear                                                              */
            /* ------------------------------------------------------------------ */

            clear() {
                terminalRef.current?.clear();
            },

            /* ------------------------------------------------------------------ */
            /* stdin                                                              */
            /* ------------------------------------------------------------------ */

            async writeIn(): Promise<string> {
                const terminal =
                    terminalRef.current;

                if (!terminal) {
                    throw new Error(
                        "Terminal unavailable.",
                    );
                }

                /*
                 * There should only ever be one
                 * active terminal input session.
                 */
                if (
                    cancelInputRef.current
                ) {

                    cancelInputRef.current();
                }

                return await new Promise<string>(
                    (
                        resolve,
                        reject,
                    ) => {
                        let input = "";
                        let cursor = 0;
                        let settled = false;

                        let disposable:
                            ReturnType<
                                XTerm["onData"]
                            >;

                        const finish = (
                            value: string,
                        ) => {
                            if (settled) {
                                return;
                            }

                            settled = true;

                            disposable.dispose();

                            cancelInputRef.current =
                                null;

                            resolve(value);
                        };

                        const cancel = () => {
                            if (settled) {
                                return;
                            }

                            settled = true;

                            disposable.dispose();

                            cancelInputRef.current =
                                null;

                            /*
                             * IMPORTANT:
                             *
                             * Cancellation is NOT the same
                             * thing as the user entering "".
                             *
                             * Reject instead of resolving ""
                             * so the caller cannot accidentally
                             * send an empty string to Python.
                             */
                            reject(
                                new Error(
                                    "Terminal input cancelled.",
                                ),
                            );
                        };

                        disposable =
                            terminal.onData(
                                (data) => {
                                    if (settled) {
                                        return;
                                    }

                                    /* -------------------------------------------------- */
                                    /* ENTER                                              */
                                    /* -------------------------------------------------- */

                                    if (
                                        data === "\r" ||
                                        data === "\n"
                                    ) {
                                        /*
                                         * Visually submit the line.
                                         *
                                         * The newline is NOT included
                                         * in the value returned to Python.
                                         */
                                        terminal.write(
                                            "\r\n",
                                        );

                                        finish(
                                            input,
                                        );

                                        return;
                                    }

                                    /* -------------------------------------------------- */
                                    /* CTRL+C                                             */
                                    /* -------------------------------------------------- */

                                    if (
                                        data === "\x03"
                                    ) {
                                        cancel();

                                        return;
                                    }

                                    /* -------------------------------------------------- */
                                    /* BACKSPACE                                          */
                                    /* -------------------------------------------------- */

                                    if (
                                        data === "\x7f" ||
                                        data === "\b"
                                    ) {
                                        if (
                                            cursor === 0
                                        ) {
                                            return;
                                        }

                                        input =
                                            input.slice(
                                                0,
                                                cursor - 1,
                                            ) +
                                            input.slice(
                                                cursor,
                                            );

                                        cursor--;

                                        terminal.write(
                                            "\b",
                                        );

                                        terminal.write(
                                            input.slice(
                                                cursor,
                                            ),
                                        );

                                        terminal.write(
                                            " ",
                                        );

                                        const distance =
                                            input.length -
                                            cursor +
                                            1;

                                        if (
                                            distance >
                                            0
                                        ) {
                                            terminal.write(
                                                `\x1b[${distance}D`,
                                            );
                                        }

                                        return;
                                    }

                                    /* -------------------------------------------------- */
                                    /* LEFT ARROW                                         */
                                    /* -------------------------------------------------- */

                                    if (
                                        data ===
                                        "\x1b[D"
                                    ) {
                                        if (
                                            cursor >
                                            0
                                        ) {
                                            cursor--;

                                            terminal.write(
                                                "\x1b[D",
                                            );
                                        }

                                        return;
                                    }

                                    /* -------------------------------------------------- */
                                    /* RIGHT ARROW                                        */
                                    /* -------------------------------------------------- */

                                    if (
                                        data ===
                                        "\x1b[C"
                                    ) {
                                        if (
                                            cursor <
                                            input.length
                                        ) {
                                            cursor++;

                                            terminal.write(
                                                "\x1b[C",
                                            );
                                        }

                                        return;
                                    }

                                    /* -------------------------------------------------- */
                                    /* IGNORE OTHER ESCAPE SEQUENCES                    */
                                    /* -------------------------------------------------- */

                                    if (
                                        data.startsWith(
                                            "\x1b",
                                        )
                                    ) {
                                        return;
                                    }

                                    /* -------------------------------------------------- */
                                    /* NORMAL CHARACTER                                  */
                                    /* -------------------------------------------------- */

                                    for (
                                        const character of data
                                    ) {
                                        /*
                                         * Ignore control characters.
                                         */
                                        if (
                                            character.charCodeAt(
                                                0,
                                            ) <
                                            32
                                        ) {
                                            continue;
                                        }

                                        input =
                                            input.slice(
                                                0,
                                                cursor,
                                            ) +
                                            character +
                                            input.slice(
                                                cursor,
                                            );

                                        cursor++;

                                        /* ---------------------------------------------- */
                                        /* Append                                          */
                                        /* ---------------------------------------------- */

                                        if (
                                            cursor ===
                                            input.length
                                        ) {
                                            terminal.write(
                                                character,
                                            );

                                            continue;
                                        }

                                        /* ---------------------------------------------- */
                                        /* Insert into middle                             */
                                        /* ---------------------------------------------- */

                                        terminal.write(
                                            input.slice(
                                                cursor - 1,
                                            ),
                                        );

                                        const distance =
                                            input.length -
                                            cursor;

                                        if (
                                            distance >
                                            0
                                        ) {
                                            terminal.write(
                                                `\x1b[${distance}D`,
                                            );
                                        }
                                    }
                                },
                            );

                        cancelInputRef.current =
                            cancel;
                    },
                );
            },

            /* ------------------------------------------------------------------ */
            /* cancelInput                                                        */
            /* ------------------------------------------------------------------ */

            cancelInput() {

                cancelInputRef.current?.();
            },
        }),
        [],
    );

    useEffect(() => {
        if (!containerRef.current) {
            return;
        }

        const terminal =
    new XTerm({
        cursorBlink: true,

        convertEol: false,

        fontSize:
            window.innerWidth < 640
                ? 12
                : window.innerWidth < 1024
                    ? 13
                    : 14,

        fontFamily:
            '"Cascadia Mono", "Segoe UI Emoji", monospace',

        theme: {
            background:
                "#0d1117",
        },
    });

        const fitAddon =
            new FitAddon();

        terminal.loadAddon(
            fitAddon,
        );

        terminal.open(
            containerRef.current,
        );

        fitAddon.fit();

        /* ------------------------------------------------------------------ */
        /* Clipboard                                                          */
        /* ------------------------------------------------------------------ */

        terminal.attachCustomKeyEventHandler(
            (event) => {
                if (
                    event.type ===
                        "keydown" &&
                    event.ctrlKey &&
                    !event.shiftKey &&
                    event.key.toLowerCase() ===
                        "c"
                ) {
                    const selection =
                        terminal.getSelection();

                    if (
                        selection.length >
                        0
                    ) {
                        void navigator.clipboard.writeText(
                            selection,
                        );

                        return false;
                    }
                }

                return true;
            },
        );

        terminalRef.current =
            terminal;

        fitAddonRef.current =
            fitAddon;

        /* ------------------------------------------------------------------ */
        /* Resize                                                             */
        /* ------------------------------------------------------------------ */

        const resizeObserver =
            new ResizeObserver(() => {
                fitAddon.fit();
            });

        resizeObserver.observe(
            containerRef.current,
        );

        /* ------------------------------------------------------------------ */
        /* Cleanup                                                            */
        /* ------------------------------------------------------------------ */

        return () => {

            cancelInputRef.current?.();

            cancelInputRef.current =
                null;

            resizeObserver.disconnect();

            terminal.dispose();

            terminalRef.current =
                null;

            fitAddonRef.current =
                null;
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="h-full w-full overflow-hidden bg-black"
        />
    );
});

XtermTerminal.displayName =
    "XtermTerminal";

export default XtermTerminal;