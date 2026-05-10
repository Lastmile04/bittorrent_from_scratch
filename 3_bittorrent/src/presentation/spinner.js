export class Spinner {
    constructor(ip, port, attempt, max) {
        this.ip = ip;
        this.port = port;
        this.attempt = attempt;
        this.max = max;
        this.frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
        this.running = false;
        this.timer = null;

        // UI State
        this.phase = 'CONNECT';
        this.progress = 0;
        this.statusMsg = '';
    }

    // Progress Bar Logic
    renderProgressBar() {
        const size = 15;
        const completed = Math.floor((this.progress / 100) * size);
        const remaining = size - completed;
        return `[${'■'.repeat(completed)}${'□'.repeat(remaining)}] ${this.progress}%`;
    }

    start() {
        if (this.running) return;
        this.running = true;
        process.stdout.write('\u001B[?25l');

        let x = 0;
        this.timer = setInterval(() => {
            const frame = this.frames[x++ % this.frames.length];
            const bar = this.progress > 0 ? ` | ${this.renderProgressBar()}` : '';
            const phase = `\x1b[33m[${this.phase}]\x1b[0m`;

            // Render the full line state
            process.stdout.write(`\r\x1B[2K${frame} ${phase} ${this.ip}:${this.port} (atmt ${this.attempt}/${this.max})${bar}`);
        }, 80);
    }

    // State updaters
    updatePhase(p) { this.phase = p.toUpperCase(); }
    updateProgress(p) { this.progress = p; }

    // The Graveyard
    // This persists the line by simply moving to a NEW line after stopping
    stop(status, finalMsg = '') {
        if (!this.running) return;
        this.running = false;
        clearInterval(this.timer);
        process.stdout.write('\u001B[?25h');

        const isSuccess = status === 'success';
        const symbol = isSuccess ? '\x1b[32m✔\x1b[0m' : '\x1b[31m✖\x1b[0m';
        const label = isSuccess ? 'COMPLETE' : 'FAILED';
        const reason = isSuccess ? '' : ` \x1b[90m(${finalMsg})\x1b[0m`;
        // Finalize line and move cursor down to keep this in the "Graveyard"
        process.stdout.write(`\r\x1B[2K${symbol} ${this.ip}:${this.port} - ${label}${reason}\n`);


    }
}
