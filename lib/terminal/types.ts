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
     * Waits for user input and resolves with the
     * submitted value.
     */
    writeIn(): Promise<string>;

    /**
     * Cancels the currently active input request,
     * if one exists.
     */
    cancelInput(): void;

    /**
     * Clears all terminal output.
     */
    clear(): void;
}