"use client";

import {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from "react";

import runtime, {
    type RuntimeHandle,
} from "@/lib/runtime/RunTime";

import XtermTerminal from "./XtermTerminal";

import type {
    Terminal,
} from "@/lib/terminal/types";

const MIN_HEIGHT = 200;
const MAX_HEIGHT_RATIO = 0.9;
const DEFAULT_HEIGHT_RATIO = 0.6;

const RunWindow = forwardRef<RuntimeHandle>((_, ref) => {
    const terminalRef =
        useRef<Terminal>(null);

    const windowRef =
        useRef<HTMLDivElement>(null);

    const [isOpen, setIsOpen] =
        useState(false);

    const [title, setTitle] =
        useState("Runtime");

    const [height, setHeight] =
        useState(
            `${DEFAULT_HEIGHT_RATIO * 100}vh`,
        );

    const resizingRef =
        useRef(false);

    const startYRef =
        useRef(0);

    const startHeightRef =
        useRef(0);

    const runtimeHandle: RuntimeHandle = {
        open(runtimeTitle = "Runtime") {
            setTitle(runtimeTitle);
            setIsOpen(true);
        },

        close() {
            setIsOpen(false);
        },

        toggle() {
            setIsOpen((value) => !value);
        },

        writeOut(text, color) {
            terminalRef.current!.writeOut(
                text,
                color,
            );
        },

        writeErr(text) {
            terminalRef.current!.writeErr(
                text,
            );
        },

        writeIn() {
            return terminalRef.current!.writeIn();
        },

        cancelInput() {
            terminalRef.current!.cancelInput();
        },

        clear() {
            terminalRef.current!.clear();
        },
    };

    useImperativeHandle(
        ref,
        () => runtimeHandle,
    );

    useEffect(() => {
        runtime.register(
            runtimeHandle,
        );
    }, []);

    /* ---------------------------------------------------------------------- */
    /* Resize                                                                 */
    /* ---------------------------------------------------------------------- */

    useEffect(() => {
        const handlePointerMove = (
            event: PointerEvent,
        ) => {
            if (!resizingRef.current) {
                return;
            }

            const delta =
                startYRef.current -
                event.clientY;

            const maxHeight =
                window.innerHeight *
                MAX_HEIGHT_RATIO;

            const nextHeight =
                Math.min(
                    maxHeight,
                    Math.max(
                        MIN_HEIGHT,
                        startHeightRef.current +
                            delta,
                    ),
                );

            setHeight(
                `${nextHeight}px`,
            );
        };

        const handlePointerUp = () => {
            if (!resizingRef.current) {
                return;
            }

            resizingRef.current =
                false;

            document.body.style.userSelect =
                "";

            document.body.style.cursor =
                "";
        };

        window.addEventListener(
            "pointermove",
            handlePointerMove,
        );

        window.addEventListener(
            "pointerup",
            handlePointerUp,
        );

        return () => {
            window.removeEventListener(
                "pointermove",
                handlePointerMove,
            );

            window.removeEventListener(
                "pointerup",
                handlePointerUp,
            );
        };
    }, []);

    const startResize = (
        event: React.PointerEvent,
    ) => {
        const element =
            windowRef.current;

        if (!element) {
            return;
        }

        resizingRef.current =
            true;

        startYRef.current =
            event.clientY;

        startHeightRef.current =
            element.getBoundingClientRect()
                .height;

        document.body.style.userSelect =
            "none";

        document.body.style.cursor =
            "ns-resize";

        event.preventDefault();
    };

    return (
        <div
            ref={windowRef}
            className={`
                fixed
                inset-x-0
                bottom-0
                z-50
                flex
                flex-col
                overflow-hidden
                border-t
                border-zinc-700/80
                bg-[#0d1117]
                shadow-[0_-12px_40px_rgba(0,0,0,0.35)]
                transition-transform
                duration-300
                ease-out
                ${
                    isOpen
                        ? "translate-y-0"
                        : "translate-y-full"
                }
            `}
            style={{
                height,
            }}
        >
            {/* ---------------------------------------------------------------- */}
            {/* Resize Handle                                                     */}
            {/* ---------------------------------------------------------------- */}

            <div
                onPointerDown={startResize}
                className="
                    group
                    flex
                    h-7
                    shrink-0
                    cursor-ns-resize
                    touch-none
                    items-center
                    justify-center
                "
            >
                <div
                    className="
                        h-1
                        w-12
                        rounded-full
                        bg-zinc-700
                        transition-all
                        duration-150
                        group-hover:w-16
                        group-hover:bg-zinc-500
                    "
                />
            </div>

            {/* ---------------------------------------------------------------- */}
            {/* Header                                                             */}
            {/* ---------------------------------------------------------------- */}

            <div
                className="
                    flex
                    h-12
                    shrink-0
                    items-center
                    justify-between
                    border-b
                    border-zinc-800
                    bg-[#161b22]
                    px-4
                    sm:px-5
                "
            >
                {/* Runtime identity */}

                <div className="flex items-center gap-3">
                    <div
                        className="
                            flex
                            h-7
                            w-7
                            items-center
                            justify-center
                            rounded-md
                            bg-zinc-800
                            text-zinc-300
                        "
                    >
                        <span className="text-sm">
                            ›_
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <span
                            className="
                                text-sm
                                font-medium
                                text-zinc-100
                            "
                        >
                            {title}
                        </span>
                    </div>
                </div>

                {/* Window controls */}

                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() =>
                            terminalRef.current?.clear()
                        }
                        aria-label="Clear terminal"
                        title="Clear terminal"
                        className="
                            flex
                            h-8
                            w-8
                            items-center
                            justify-center
                            rounded-md
                            text-zinc-500
                            transition
                            hover:bg-zinc-800
                            hover:text-zinc-200
                        "
                    >
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            className="h-4 w-4"
                        >
                            <path
                                d="M4 7h16"
                            />
                            <path
                                d="M10 11v6"
                            />
                            <path
                                d="M14 11v6"
                            />
                            <path
                                d="M5 7l1 13h12l1-13"
                            />
                            <path
                                d="M9 7V4h6v3"
                            />
                        </svg>
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            setIsOpen(false)
                        }
                        aria-label="Close runtime"
                        title="Close"
                        className="
                            flex
                            h-8
                            w-8
                            items-center
                            justify-center
                            rounded-md
                            text-zinc-500
                            transition
                            hover:bg-zinc-800
                            hover:text-zinc-100
                        "
                    >
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="h-4 w-4"
                        >
                            <path
                                d="M6 6l12 12"
                            />
                            <path
                                d="M18 6L6 18"
                            />
                        </svg>
                    </button>
                </div>
            </div>

            {/* ---------------------------------------------------------------- */}
            {/* Terminal                                                           */}
            {/* ---------------------------------------------------------------- */}

            <div
                className="
                    min-h-0
                    flex-1
                    overflow-hidden
                    bg-[#0d1117]
                "
            >
                <XtermTerminal
                    ref={terminalRef}
                />
            </div>
        </div>
    );
});

RunWindow.displayName =
    "RunWindow";

export default RunWindow;