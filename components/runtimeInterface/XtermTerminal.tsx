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
    const containerRef = useRef<HTMLDivElement>(null);

    const terminalRef = useRef<XTerm | null>(null);

    const fitAddonRef = useRef<FitAddon | null>(null);

    const focusedRef = useRef(false);

    useImperativeHandle(ref, () => ({
        writeOut(
            stdOut: string,
            color?: string,
        ) {
            if (!terminalRef.current) return;

            const output =
                stdOut.endsWith("\r\n")
                    ? stdOut
                    : stdOut + "\r\n";

            if (color) {
                terminalRef.current.write(
                    `\x1b[${color}m${output}\x1b[0m`,
                );

                return;
            }

            terminalRef.current.write(output);
        },

        writeErr(
            stdErr: string,
        ) {
            if (!terminalRef.current) return;

            const output =
                stdErr.endsWith("\r\n")
                    ? stdErr
                    : stdErr + "\r\n";

            terminalRef.current.write(
                `\x1b[31m${output}\x1b[0m`,
            );
        },

        clear() {
            terminalRef.current?.clear();
        },

        async writeIn(
            placeholder = "",
        ): Promise<string> {
            if (!terminalRef.current) {
                return "";
            }

            const terminal =
                terminalRef.current;

            terminal.write(
                placeholder,
            );

            return await new Promise<string>(
                (resolve) => {
                    let input = "";

                    let cursor = 0;

                    const redraw = () => {
                        terminal.write("\r");

                        terminal.write(
                            placeholder + input,
                        );

                        terminal.write("\x1b[K");

                        const moveLeft =
                            input.length - cursor;

                        if (moveLeft > 0) {
                            terminal.write(
                                `\x1b[${moveLeft}D`,
                            );
                        }
                    };

                    const disposable =
                        terminal.onData(
                            (data) => {

                                // Ignore key presses until
                                // the user clicks inside the terminal.
                                if (!focusedRef.current) {
                                    return;
                                }

                                switch (data) {

                                    case "\r":

                                        terminal.write(
                                            "\r\n",
                                        );

                                        disposable.dispose();

                                        resolve(input);

                                        return;

                                    case "\x7f":

                                        if (cursor === 0) {
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

                                        redraw();

                                        return;

                                    case "\x1b[D":

                                        if (cursor > 0) {

                                            cursor--;

                                            terminal.write(
                                                "\x1b[D",
                                            );
                                        }

                                        return;

                                    case "\x1b[C":

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

                                    default:

                                        if (
                                            data.length !== 1 ||
                                            data < " "
                                        ) {
                                            return;
                                        }

                                        input =
                                            input.slice(
                                                0,
                                                cursor,
                                            ) +
                                            data +
                                            input.slice(
                                                cursor,
                                            );

                                        cursor++;

                                        redraw();
                                }
                            },
                        );
                },
            );
        },
    }));

    useEffect(() => {

        if (!containerRef.current) {
            return;
        }

        const terminal =
            new XTerm({
                cursorBlink: true,

                convertEol: true,

                theme: {
                    background: "#0d1117",
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

        // Track whether the terminal currently has focus.
        containerRef.current.addEventListener(
            "focusin",
            () => {
                focusedRef.current = true;
            },
        );

        containerRef.current.addEventListener(
            "focusout",
            () => {
                focusedRef.current = false;
            },
        );

        terminal.attachCustomKeyEventHandler(
            (event) => {

                if (
                    event.type === "keydown" &&
                    event.ctrlKey &&
                    !event.shiftKey &&
                    event.key.toLowerCase() === "c"
                ) {

                    const selection =
                        terminal.getSelection();

                    if (selection.length > 0) {

                        navigator.clipboard.writeText(
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

        const resizeObserver =
            new ResizeObserver(() => {
                fitAddon.fit();
            });

        resizeObserver.observe(
            containerRef.current,
        );

        return () => {

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