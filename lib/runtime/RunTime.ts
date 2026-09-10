export interface RuntimeHandle {
    open(title?: string): void;
    close(): void;
    toggle(): void;

    writeOut(
        text: string,
        color?: string,
    ): void;

    writeErr(
        text: string,
    ): void;

    writeIn(): Promise<string>;

    cancelInput(): void;

    clear(): void;
}

class Runtime {
    private runWindow: RuntimeHandle | null = null;

    /**
     * Called once by <RunWindow /> when it mounts.
     */
    register(runWindow: RuntimeHandle) {
        this.runWindow = runWindow;
    }

    /**
     * Opens the runtime window.
     */
    open(title = "Runtime") {
        this.runWindow!.open(title);
    }

    /**
     * Closes the runtime window.
     */
    close() {
        this.runWindow!.close();
    }

    /**
     * Toggles the runtime window.
     */
    toggle() {
        this.runWindow!.toggle();
    }

    /**
     * Writes stdout.
     */
    writeOut(
        text: string,
        color?: string,
    ) {
        this.runWindow!.writeOut(
            text,
            color,
        );
    }

    /**
     * Writes stderr.
     */
    writeErr(
        text: string,
    ) {
        this.runWindow!.writeErr(text);
    }

    /**
     * Reads stdin.
     *
     * This method does not render anything.
     * It simply waits for the user's input.
     */
    writeIn(): Promise<string> {
        return this.runWindow!.writeIn();
    }

    /**
     * Cancels the currently active stdin
     * request, if one exists.
     */
    cancelInput() {
        this.runWindow!.cancelInput();
    }

    /**
     * Clears the terminal.
     */
    clear() {
        this.runWindow!.clear();
    }
}

const runtime =
    new Runtime();

export default runtime;