"use client";

import { useEffect } from "react";

import type { EditorLanguage } from "@/components/editor/CodeMirrorEditor";

export interface Course {
    id: string;
    name: string;
    language: EditorLanguage;
    level: string;
    duration: string;
    description: string;
}

interface CourseModalProps {
    course: Course | null;
    onClose: () => void;
}

export default function CourseModal({
    course,
    onClose,
}: CourseModalProps) {
    useEffect(() => {
        if (!course) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [course, onClose]);

    if (!course) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
                    <div>
                        <h2 className="text-2xl font-semibold text-white">
                            {course.name}
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-zinc-400 transition hover:bg-white/10 hover:text-white"
                    >
                        ×
                    </button>
                </div>

                <div className="space-y-6 p-6">
                    <p className="leading-7 text-zinc-300">
                        {course.description}
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-white/10 bg-white/3 p-4">
                            <p className="text-xs uppercase tracking-wide text-zinc-500">
                                Level
                            </p>

                            <p className="mt-1 text-sm font-medium text-white">
                                {course.level}
                            </p>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-white/3 p-4">
                            <p className="text-xs uppercase tracking-wide text-zinc-500">
                                Duration
                            </p>

                            <p className="mt-1 text-sm font-medium text-white">
                                {course.duration}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <button
                            type="button"
                            className="w-full rounded-xl bg-emerald-500 px-5 py-3.5 text-sm font-semibold text-black transition hover:bg-emerald-400"
                        >
                            Join the on site class
                        </button>

                        <button
                            type="button"
                            className="w-full rounded-xl border border-white/15 bg-white/5 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
                        >
                            Join the online class
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}