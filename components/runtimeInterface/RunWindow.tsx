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

const RunWindow = forwardRef<RuntimeHandle>((_, ref) => {
    const terminalRef =
        useRef<Terminal>(null);

    const [isOpen, setIsOpen] =
        useState(false);

    const [title, setTitle] =
        useState("Runtime");

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

    return (
        <div
            className={`
                fixed
                inset-x-0
                bottom-0
                z-50
                h-[60vh]
                flex
                flex-col
                border-t
                border-zinc-700
                bg-[#0d1117]
                shadow-2xl
                transition-transform
                duration-300
                ease-in-out
                ${
                    isOpen
                        ? "translate-y-0"
                        : "translate-y-full"
                }
            `}
        >
            {/* Drag Handle */}
            <div className="flex justify-center py-2">
                <div className="h-1.5 w-16 rounded-full bg-zinc-600" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-700 px-4 py-3">
                <span className="font-medium text-zinc-100">
                    {title}
                </span>

                <button
                    onClick={() =>
                        setIsOpen(false)
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
                >
                    ✕
                </button>
            </div>

            {/* Terminal */}
            <div className="min-h-0 flex-1 overflow-hidden">
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