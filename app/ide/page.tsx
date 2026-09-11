"use client";

import Link from "next/link";

type Language = {
    name: string;
    description: string;
    icon: string;
    href: string;
};

const languages: Language[] = [
    {
        name: "Python",
        description: "Python programming language",
        icon: "python.png",
        href: "/ide/python",
    },
];

export default function IDEPage() {
    return (
        <main className="min-h-screen bg-[#0d1117] text-[#e6edf3]">
            {/* -------------------------------------------------------------- */}
            {/* Editor Header                                                   */}
            {/* -------------------------------------------------------------- */}

            <header className="flex h-12 items-center border-b border-[#30363d] bg-[#161b22] px-4">
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-[#8b949e]">
                        IDE
                    </span>

                    <span className="text-[#484f58]">
                        /
                    </span>

                    <span className="text-[#e6edf3]">
                        Languages
                    </span>
                </div>
            </header>

            {/* -------------------------------------------------------------- */}
            {/* Workspace                                                       */}
            {/* -------------------------------------------------------------- */}

            <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
                <div className="mb-8">
                    <h1 className="text-xl font-medium">
                        Choose a language
                    </h1>

                    <p className="mt-1 text-sm text-[#8b949e]">
                        Select a language to open its editor.
                    </p>
                </div>

                {/* ---------------------------------------------------------- */}
                {/* Language List                                                */}
                {/* ---------------------------------------------------------- */}

                <div className="border border-[#30363d] bg-[#161b22]">
                    {languages.map((language, index) => (
                        <Link
                            key={language.name}
                            href={language.href}
                            className={`
                                group
                                flex
                                min-h-20
                                items-center
                                gap-4
                                px-4
                                py-4
                                transition-colors
                                hover:bg-[#1c2128]
                                sm:px-5
                                ${
                                    index !==
                                    languages.length - 1
                                        ? "border-b border-[#30363d]"
                                        : ""
                                }
                            `}
                        >
                            {/* Language icon */}

                            <div
                                className="
                                    flex
                                    h-11
                                    w-11
                                    shrink-0
                                    items-center
                                    justify-center
                                    border
                                    border-[#30363d]
                                    bg-[#0d1117]
                                "
                            >
                                <img
                                    src={language.icon}
                                    alt={`${language.name} logo`}
                                    className="h-7 w-7 object-contain"
                                />
                            </div>

                            {/* Language information */}

                            <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium text-[#e6edf3]">
                                    {language.name}
                                </div>

                                <div className="mt-1 text-xs text-[#8b949e]">
                                    {language.description}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </main>
    );
}