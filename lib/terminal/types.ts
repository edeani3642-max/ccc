export interface Terminal {
    /**
     * Writes standard output to the terminal.
     *
     * An optional color may be supplied by the runtime.
     */
    writeOut(
        stdOut: string,
        color?: string,
    ): void;

    /**
     * Writes standard error to the terminal.
     */
    writeErr(
        stdErr: string,
    ): void;

    /**
     * Displays an optional placeholder and waits for user input.
     *
     * Example:
     * const name = await terminal.writeIn("Name: ");
     */
    writeIn(
        placeholder?: string,
    ): Promise<string>;

    /**
     * Clears all terminal output.
     */
    clear(): void;
}