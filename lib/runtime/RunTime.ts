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

    writeIn(
        placeholder?: string,
    ): Promise<string>;

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
     */
    writeIn(
        placeholder?: string,
    ): Promise<string> {
        return this.runWindow!.writeIn(
            placeholder,
        );
    }

    /**
     * Clears the terminal.
     */
    clear() {
        this.runWindow!.clear();
    }
}

const runtime = new Runtime();

export default runtime;