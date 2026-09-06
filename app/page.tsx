"use client";

import { useState } from "react";

import Hero from "@/components/landing/Hero";
import LanguageShowcase from "@/components/landing/LanguageShowcase";

export default function HomePage() {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <main className="min-h-screen bg-zinc-950 text-white">

            {/* ============================================================
                01. NAVIGATION
            ============================================================ */}

            <header className="fixed inset-x-0 top-0 z-40 backdrop-blur-sm border-zinc-600 border-b">
                <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-6">
                    <a
                        href="#home"
                        className="text-lg font-semibold tracking-tight"
                        onClick={() => setMenuOpen(false)}
                    >
                        CampusCodeCamp
                        <p className="text-[0.7rem] bg-linear-to-br from-white via-zinc-500 to-zinc-800 bg-clip-text text-transparent">BUILT FOR BEGINNERS</p>
                    </a>

                    {/* Desktop navigation */}
                    <div className="hidden items-center gap-8 text-sm text-zinc-300 md:flex">
                        <a
                            href="#courses"
                            className="transition hover:text-white"
                        >
                            Courses
                        </a>

                        <a
                            href="#features"
                            className="transition hover:text-white"
                        >
                            Learn
                        </a>

                        <a
                            href="#about"
                            className="transition hover:text-white"
                        >
                            About
                        </a>
                    </div>

                    {/* Mobile navigation button */}
                    <button
                        type="button"
                        aria-label="Toggle navigation"
                        aria-expanded={menuOpen}
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xl text-white transition hover:bg-white/10 md:hidden"
                    >
                        {menuOpen ? "×" : "☰"}
                    </button>
                </nav>

                {/* Mobile menu */}
                {menuOpen && (
                    <div className="border-t border-white/10 bg-zinc-950/95 px-6 py-4 backdrop-blur-md md:hidden">
                        <div className="flex flex-col gap-1 text-sm text-zinc-300">
                            <a
                                href="#courses"
                                onClick={() => setMenuOpen(false)}
                                className="rounded-lg px-3 py-3 transition hover:bg-white/5 hover:text-white"
                            >
                                Courses
                            </a>

                            <a
                                href="#features"
                                onClick={() => setMenuOpen(false)}
                                className="rounded-lg px-3 py-3 transition hover:bg-white/5 hover:text-white"
                            >
                                Learn
                            </a>

                            <a
                                href="#about"
                                onClick={() => setMenuOpen(false)}
                                className="rounded-lg px-3 py-3 transition hover:bg-white/5 hover:text-white"
                            >
                                About
                            </a>
                        </div>
                    </div>
                )}
            </header>


            {/* ============================================================
                02. HERO
            ============================================================ */}

            <Hero />


            {/* ============================================================
                03. LANGUAGE SHOWCASE
            ============================================================ */}

            <LanguageShowcase />


            {/* ============================================================
                04. QUOTE + IMAGE
            ============================================================ */}

            <section
                id="about"
                className="bg-zinc-950 px-6 py-24 text-white"
            >
                <div className="mx-auto grid max-w-7xl overflow-hidden border border-white/10 bg-zinc-900/40 lg:grid-cols-[1.1fr_0.9fr]">

                    {/* Quote */}
                    <div className="flex items-center px-8 py-16 sm:px-12 lg:px-16">
                        <div className="max-w-2xl">
                            <p className="text-3xl font-medium leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                                “Everybody should learn to program
                                a computer, because it teaches you
                                how to think.”
                            </p>

                            <p className="mt-8 text-sm font-medium text-zinc-400">
                                — Steve Jobs
                            </p>
                        </div>
                    </div>

                    {/* Image placeholder */}
                    <div className="relative min-h-[360px] bg-zinc-800">
                        <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{
                                backgroundImage:
                                    "url('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80')",
                            }}
                        />

                        <div className="absolute inset-0 bg-black/30" />
                    </div>
                </div>
            </section>


            {/* ============================================================
                05. LEARNING FEATURES
            ============================================================ */}

            <section
                id="features"
                className="bg-zinc-950 px-6 py-24 text-white"
            >
                <div className="mx-auto max-w-7xl">

                    <div className="mb-14 max-w-2xl">
                        <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">
                            Built around you
                        </p>

                        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                            Learning that fits the way you learn.
                        </h2>
                    </div>

                    <div className="grid gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">

                        <div>
                            <div className="mb-4 text-2xl">◉</div>

                            <h3 className="font-semibold">
                                Interactive learning
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-zinc-400">
                                Learn concepts and immediately put
                                them into practice.
                            </p>
                        </div>

                        <div>
                            <div className="mb-4 text-2xl">◷</div>

                            <h3 className="font-semibold">
                                Your own pace
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-zinc-400">
                                Learn when you want and continue
                                from where you stopped.
                            </p>
                        </div>

                        <div>
                            <div className="mb-4 text-2xl">✓</div>

                            <h3 className="font-semibold">
                                Weekly assignments
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-zinc-400">
                                Regular assignments help you build
                                consistency and track your performance.
                            </p>
                        </div>

                        <div>
                            <div className="mb-4 text-2xl">◎</div>

                            <h3 className="font-semibold">
                                Progress tracking
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-zinc-400">
                                Always know what you've learned and
                                what comes next.
                            </p>
                        </div>

                        <div>
                            <div className="mb-4 text-2xl">⌁</div>

                            <h3 className="font-semibold">
                                GPA calculation
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-zinc-400">
                                Your weekly work will be compiled
                                into an overall performance score.
                            </p>
                        </div>

                        <div>
                            <div className="mb-4 text-2xl">◇</div>

                            <h3 className="font-semibold">
                                Certificates
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-zinc-400">
                                Complete your course and earn a
                                certificate of completion.
                            </p>
                        </div>

                        <div>
                            <div className="mb-4 text-2xl">⌘</div>

                            <h3 className="font-semibold">
                                Browser-based coding
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-zinc-400">
                                Write and run code without a complicated
                                local setup.
                            </p>
                        </div>

                        <div>
                            <div className="mb-4 text-2xl">+</div>

                            <h3 className="font-semibold">
                                Capstone project
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-zinc-400">
                                A chance to turn what you have learned into something useful
                            </p>
                        </div>

                    </div>
                </div>
            </section>


            {/* ============================================================
                06. HOW IT WORKS
            ============================================================ */}

            <section className="border-y border-white/5 bg-zinc-900/30 px-6 py-24 text-white">
                <div className="mx-auto max-w-7xl">

                    <div className="mb-14">
                        <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">
                            The process
                        </p>

                        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                            What you will do
                        </h2>
                    </div>

                    <div className="grid gap-10 md:grid-cols-4">

                        <div>
                            <span className="text-sm text-zinc-500">
                                01
                            </span>

                            <h3 className="mt-3 text-xl font-semibold">
                                Learn
                            </h3>

                            <p className="mt-2 text-sm text-zinc-400">
                                Understand the concept.
                            </p>
                        </div>

                        <div>
                            <span className="text-sm text-zinc-500">
                                02
                            </span>

                            <h3 className="mt-3 text-xl font-semibold">
                                Write
                            </h3>

                            <p className="mt-2 text-sm text-zinc-400">
                                Put it into code.
                            </p>
                        </div>

                        <div>
                            <span className="text-sm text-zinc-500">
                                03
                            </span>

                            <h3 className="mt-3 text-xl font-semibold">
                                Practice
                            </h3>

                            <p className="mt-2 text-sm text-zinc-400">
                                Solve problems and assignments.
                            </p>
                        </div>

                        <div>
                            <span className="text-sm text-zinc-500">
                                04
                            </span>

                            <h3 className="mt-3 text-xl font-semibold">
                                Build
                            </h3>

                            <p className="mt-2 text-sm text-zinc-400">
                                Turn your knowledge into projects.
                            </p>
                        </div>

                    </div>
                </div>
            </section>


            {/* ============================================================
                07. FINAL CTA
            ============================================================ */}

            <section className="bg-zinc-950 px-6 py-32 text-center text-white">
                <div className="mx-auto max-w-3xl">

                    <p className="text-4xl font-semibold tracking-tight sm:text-5xl">
                        Your first line of code is actually closer
                        than you think.
                    </p>

                    <p className="mx-auto mt-5 max-w-xl text-zinc-400">
                        Start learning programming through an
                        interactive experience designed for you.
                    </p>
                    <a href="#home">
                        <button
                            type="button"
                            className="mt-8 rounded-xl bg-emerald-500 px-7 py-4 text-sm font-semibold text-black transition hover:bg-emerald-400"
                        >
                            Get Started →
                        </button>
                    </a>
                </div>
            </section>


            {/* ============================================================
                08. FOOTER
            ============================================================ */}

            <footer className="border-t border-white/10 bg-zinc-950 px-6 py-8 text-white">
                <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                    <p className="font-semibold">
                        CampusCodeCamp
                    </p>

                    <div className="flex gap-6 text-sm text-zinc-500">
                        <a
                            href="#courses"
                            className="hover:text-white"
                        >
                            Courses
                        </a>

                        <a
                            href="#features"
                            className="hover:text-white"
                        >
                            Learn
                        </a>

                        <a
                            href="#about"
                            className="hover:text-white"
                        >
                            About
                        </a>
                    </div>

                    <p className="text-sm text-zinc-600">
                        © 2026 Simplified
                    </p>

                </div>
            </footer>

        </main>
    );
}