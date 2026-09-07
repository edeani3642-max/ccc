"use client";

import { useState } from "react";

function StartCodingModal({
    onClose,
}: {
    onClose: () => void;
}) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="start-coding-title"
                className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-6 text-white shadow-2xl"
            >
                <div className="mb-5 flex items-start justify-between gap-6">
                    <div>
                        <p className="mb-2 text-sm font-medium text-emerald-400">
                            Coming soon
                        </p>

                        <h2
                            id="start-coding-title"
                            className="text-2xl font-semibold tracking-tight"
                        >
                            Almost there!
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xl text-zinc-500 transition hover:bg-white/5 hover:text-white"
                    >
                        ×
                    </button>
                </div>

                <p className="leading-7 text-zinc-300">
                    The CampusCodeCamp coding environment will be
                    activated on{" "}
                    <strong className="font-medium text-white">
                        Saturday, September 12
                    </strong>
                    .
                </p>

                <p className="mt-3 leading-7 text-zinc-400">
                    We're getting everything ready for you. If you
                    can, endeavor to attend the free Python class on
                    Saturday and get your first experience with
                    CampusCodeCamp.
                </p>

                <button
                    type="button"
                    onClick={onClose}
                    className="mt-6 w-full rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-black transition hover:bg-zinc-200"
                >
                    Got it
                </button>
            </div>
        </div>
    );
}

export default function Hero() {
    const [showStartCodingModal, setShowStartCodingModal] =
        useState(false);

    const today = new Date();

    const classDate = new Date(
        today.getFullYear(),
        8,
        12,
    );

    const daysToGo = Math.ceil(
        (classDate.getTime() - today.getTime()) /
            (1000 * 60 * 60 * 24),
    );

    const classStatus =
        daysToGo === 1 ?
            "Tomorrow"
            :daysToGo > 0
                ? `${daysToGo} days to go`
                : daysToGo === 0
                    ? "Today"
                    : "Already done · Tap to see highlights";

    return (
        <>
            <section
                id="home"
                className="relative mt-16 min-h-[50svh] overflow-hidden bg-zinc-950 text-white sm:mt-0 sm:min-h-[80svh] lg:min-h-svh"
            >
                <img
                    src="/hero.png"
                    alt=""
                    className="h-auto w-full"
                />

                <div className="absolute inset-0 bg-black/70 sm:bg-black/65" />

                <div className="absolute inset-0 bg-linear-to-b from-black/50 via-black/60 to-zinc-950" />

                <div className="absolute inset-0 z-10 flex items-center justify-center">
                    <div className="mx-auto flex w-full max-w-5xl flex-col items-center px-5 py-6 text-center sm:px-6 sm:py-28 lg:py-32">
                        <p className="mb-2 text-[8px] font-semibold uppercase tracking-[0.18em] text-zinc-300 sm:mb-5 sm:text-sm sm:tracking-[0.3em]">
                            The future of learning to code
                        </p>

                        <h1 className="mx-auto max-w-4xl text-[1.2rem] font-semibold leading-[1.05] tracking-tight sm:text-5xl sm:leading-none md:text-6xl lg:text-7xl">
                            Learning programming restructured to meet
                            current needs through interactive learning
                        </h1>

                        <div className="mt-4 flex w-full max-w-xs flex-col gap-2 sm:mt-10 sm:max-w-none sm:flex-row sm:items-center sm:justify-center">
                            <a
                                href="https://chat.whatsapp.com/L4npBhH4ariIKHIMUESUR7"
                                className="flex w-full flex-col items-center justify-center rounded-lg bg-green-500 px-4 py-2.5 text-xs font-semibold leading-4 text-black shadow-md shadow-green-500/20 transition hover:bg-green-400 sm:w-auto sm:px-6 sm:py-4 sm:text-sm sm:leading-5"
                            >
                                <span>
                                    I will attend the free Python class
                                </span>

                                <span className="mt-0.5 text-[9px] font-medium text-zinc-800 sm:text-[11px]">
                                    {classStatus}
                                </span>
                            </a>

                            <button
                                type="button"
                                onClick={() =>
                                    setShowStartCodingModal(true)
                                }
                                className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/15 sm:w-auto sm:px-6 sm:py-4 sm:text-sm"
                            >
                                Start coding
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {showStartCodingModal && (
                <StartCodingModal
                    onClose={() =>
                        setShowStartCodingModal(false)
                    }
                />
            )}
        </>
    );
}