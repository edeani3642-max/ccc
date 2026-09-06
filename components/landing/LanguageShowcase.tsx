"use client";

import {
    useEffect,
    useState,
} from "react";

import CodeMirrorEditor from "@/components/editor/CodeMirrorEditor";

import CourseModal, {
    type Course,
} from "./CourseModal";

const courses: {
    course: Course;
    snippets: string[];
}[] = [
        {
            course: {
                id: "python",
                name: "Python",
                language: "python",
                level: "Beginner",
                duration: "6 weeks",
                description:
                    "Learn fundamentals of Python programming through interactive lessons, practical exercises, and projects.",
            },

            snippets: [
                `name = "CampusCodeCamp"

print(f"Hello, {name}!")`,
                `numbers = [1, 2, 3, 4, 5]

for number in numbers:
    print(number)`,
            ],
        },

        {
            course: {
                id: "javascript",
                name: "JavaScript",
                language: "javascript",
                level: "Beginner",
                duration: "6 weeks",
                description:
                    "Learn the fundamentals of JavaScript and start building interactive experiences for the web.",
            },

            snippets: [
                `const name = "CampusCodeCamp";

console.log(\`Hello, \${name}!\`);`,
                `const numbers = [1, 2, 3, 4, 5];

numbers.forEach(number => {
    console.log(number);
});`,
            ],
        },

        {
            course: {
                id: "html",
                name: "HTML",
                language: "html",
                level: "Beginner",
                duration: "4 weeks",
                description:
                    "Learn how web pages are structured and build the foundation of the websites you use every day.",
            },

            snippets: [
                `<main>
    <h1>Hello, world!</h1>
    <p>
        Welcome to CampusCodeCamp.
    </p>
</main>`,
                `<section>
    <h2>Start learning</h2>
    <button>
        Begin
    </button>
</section>`,
            ],
        },
    ];

const TYPING_SPEED = 45;
const PAUSE_AFTER_TYPING = 1800;
const PAUSE_BEFORE_TYPING = 500;

function LanguageCard({
    course,
    code,
    onClick,
}: {
    course: Course;
    code: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="group flex h-full w-full flex-col overflow-hidden border border-white/10 bg-zinc-900 p-2 text-left shadow-lg transition duration-300 hover:-translate-y-1 hover:border-emerald-400/40 hover:shadow-2xl hover:shadow-emerald-500/10"
        >
            {/* Code preview */}
            <div className="relative h-44 w-full shrink-0 overflow-hidden rounded-xl border border-white/10 bg-zinc-950">
                {/* Fake editor header */}
                <div className="absolute inset-x-0 top-0 z-10 flex h-8 items-center gap-1.5 border-b border-white/10 bg-zinc-900/95 px-3">
                    <span className="h-2 w-2 rounded-full bg-zinc-600" />
                    <span className="h-2 w-2 rounded-full bg-zinc-600" />
                    <span className="h-2 w-2 rounded-full bg-zinc-600" />

                    <span className="ml-2 text-[10px] text-zinc-500">
                        {course.name.toLowerCase()} code
                    </span>
                </div>

                <div className="absolute inset-x-0 bottom-0 top-8 overflow-hidden h-full">
                    <CodeMirrorEditor
                        language={course.language}
                        editable={false}
                        value={code}
                    />
                </div>

                <div className="pointer-events-none absolute inset-0 bg-emerald-400/0 transition duration-300 group-hover:bg-emerald-400/3" />
            </div>

            {/* Card content */}
            <div className="flex flex-1 flex-col p-4">
                <div className="flex items-start justify-between gap-3">
                    <h3 className="text-xl font-semibold tracking-tight text-white">
                        {course.name}
                    </h3>

                    <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-zinc-400">
                        {course.level}
                    </span>
                </div>

                <p className="mt-3 flex-1 text-sm leading-5 text-zinc-400">
                    {course.description}
                </p>

                {/* Card metadata */}
                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                    <div>
                        <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                            Duration
                        </p>

                        <p className="mt-1 text-xs font-medium text-zinc-300">
                            {course.duration}
                        </p>
                    </div>

                    <span className="flex items-center gap-1.5 text-xs font-medium text-white transition group-hover:text-emerald-400">
                        Start
                        <span className="transition-transform duration-300 group-hover:translate-x-1">
                            →
                        </span>
                    </span>
                </div>
            </div>
        </button>
    );
}

export default function LanguageShowcase() {
    const [selectedCourse, setSelectedCourse] =
        useState<Course | null>(null);

    const [snippetIndexes, setSnippetIndexes] = useState<
        Record<string, number>
    >({});

    const [displayedCode, setDisplayedCode] = useState<
        Record<string, string>
    >({});

    useEffect(() => {
        const timers: ReturnType<typeof setTimeout>[] = [];

        courses.forEach(({ course, snippets }) => {
            const currentSnippet =
                snippets[snippetIndexes[course.id] ?? 0];

            const currentCode =
                displayedCode[course.id] ?? "";

            if (currentCode.length < currentSnippet.length) {
                const timer = setTimeout(() => {
                    setDisplayedCode((previous) => ({
                        ...previous,
                        [course.id]: currentSnippet.slice(
                            0,
                            currentCode.length + 1,
                        ),
                    }));
                }, TYPING_SPEED);

                timers.push(timer);

                return;
            }

            const timer = setTimeout(() => {
                setDisplayedCode((previous) => ({
                    ...previous,
                    [course.id]: "",
                }));

                setSnippetIndexes((previous) => ({
                    ...previous,
                    [course.id]:
                        ((previous[course.id] ?? 0) + 1) %
                        snippets.length,
                }));
            }, PAUSE_AFTER_TYPING + PAUSE_BEFORE_TYPING);

            timers.push(timer);
        });

        return () => {
            timers.forEach(clearTimeout);
        };
    }, [displayedCode, snippetIndexes]);

    return (
        <>
            <section
                id="courses"
                className="bg-zinc-950 px-6 py-5 text-white"
            >
                <div className="mx-auto max-w-7xl">
                    <div className="mb-12 max-w-2xl">
                        <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">
                            Learn by writing code
                        </p>

                        <h2 className="text-2xl font-semibold tracking-tight sm:text-4xl">
                            Don't just read code. Write it.
                        </h2>

                        <p className="mt-4 text-zinc-400">
                            Pick a language below to start with today
                        </p>
                    </div>

                    <div className="grid items-stretch gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {courses.map(({ course }) => (
                            <LanguageCard
                                key={course.id}
                                course={course}
                                code={displayedCode[course.id] ?? ""}
                                onClick={() =>
                                    setSelectedCourse(course)
                                }
                            />
                        ))}
                    </div>
                </div>
            </section>

            <CourseModal
                course={selectedCourse}
                onClose={() => setSelectedCourse(null)}
            />
        </>
    );
}