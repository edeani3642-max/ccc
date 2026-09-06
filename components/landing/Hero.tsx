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

    return (
        <>
            <section
                id="home"
                className="relative flex min-h-[50svh] items-center overflow-hidden bg-zinc-950 text-white sm:min-h-[80svh] lg:min-h-svh"
            >
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                        backgroundImage:
                            "url('https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=2400&q=85')",
                    }}
                />

                <div className="absolute inset-0 bg-black/70" />

                <div className="absolute inset-0 bg-linear-to-b from-black/40 via-black/60 to-zinc-950" />

                <div className="relative z-10 mx-auto w-full max-w-5xl px-5 py-24 text-center sm:px-6 sm:py-28 lg:py-32">
                    <p className="mb-5 text-xs font-semibold uppercase tracking-[0.25em] text-zinc-300 sm:text-sm sm:tracking-[0.3em]">
                        The future of learning to code
                    </p>

                    <h1 className="mx-auto max-w-4xl text-3xl font-semibold leading-[1.12] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                        The study of programming restructured to meet current
                        needs through interactive learning
                    </h1>

                    <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:mt-10 sm:flex-row">
                        <a
                            href="https://chat.whatsapp.com/L4npBhH4arilKHIMUESUR7"
                            type="button"
                            className="w-full rounded-xl bg-green-500 px-6 py-4 text-sm font-semibold text-black shadow-md shadow-purple-300/20 transition hover:bg-green-400 sm:w-auto"
                        >
                            I will attend the free Python class <br />
                            <span className="text-zinc-800">
                                {
                                    12 - new Date().getDate() > 0 ? `${12 - new Date().getDate()} days to go` : 12 - new Date().getDate() === 0 ? `Today` : `Already Done. Tap to see highlights`
                                }
                            </span>

                        </a>
                        <button
                            type="button"
                            onClick={() =>
                                setShowStartCodingModal(true)
                            }
                            className="w-full rounded-xl border border-white/20 bg-white/10 px-6 py-4 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15 sm:w-auto"
                        >
                            Start coding
                        </button>
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
//https://chat.whatsapp.com/L4npBhH4arilKHIMUESUR7