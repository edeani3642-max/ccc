"use client";

import CodeBlock from "@/components/editor/CodeBlock";

import runtime from "@/lib/runtime/RunTime";

const code = `user = "John Doe"
print(f"Hello, {user}!")`;
export default function Home() {
    const runTests = async () => {
        runtime.open("JavaScript Runtime");

        runtime.clear();

        runtime.writeOut(
            "=== CampusCodeCamp Runtime Test ===\r\n\r\n"
        );

        runtime.writeOut(
            "Testing stdout...\r\n"
        );

        runtime.writeErr(
            "Testing stderr...\r\n"
        );

        const name = await runtime.writeIn(
            "Name: "
        );

        runtime.writeOut(
            `Hello, ${name}!\r\n`
        );

        const age = await runtime.writeIn(
            "Age: "
        );

        runtime.writeOut(
            `You are ${age} years old.\r\n`
        );

        runtime.writeOut(
            "\r\nAll tests passed!\r\n",
            "32",
        );
    };

    return (
        <main className="flex h-screen flex-col gap-4 bg-[#0d1117] p-8">
            <div className="flex-1">
                <CodeBlock
                    language="python"
                    value={code}
                />
            </div>

            <button
                onClick={runTests}
                className="rounded-lg bg-green-600 px-4 py-3 font-semibold text-white transition hover:bg-green-700"
            >
                Run Runtime Tests
            </button>
        </main>
    );
}