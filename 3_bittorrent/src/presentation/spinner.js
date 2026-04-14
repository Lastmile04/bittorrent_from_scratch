export class Spinner{
    constructor(ip, port, attempt, max){
        this.ip = ip;
        this.port = port;
        this.attempt = attempt;
        this.max = max;
        this.frames = ["⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠧","⠇","⠏"];
        this.running = false;
        this.timer = null;
    }

    start(){
        if(this.running) return;
        this.running = true;

        let x = 0;
        process.stdout.write('\u001B[?25l');

        this.timer = setInterval(()=>{
            const frame = this.frames[x++ % this.frames.length];
            process.stdout.write(`\r\x1B[2K${frame} Trying ${this.ip}:${this.port} (attempt ${this.attempt}/${this.max})`);
        }, 80);
    }

    stop(status){
        if (!this.running) return;
        this.running = false;
    
        if (this.timer) {
           clearInterval(this.timer);
           this.timer = null;
        }

        process.stdout.write('\u001B[?25h'); // Show cursor

        const symbol = status === 'success' ? '✔' : '✖';
        // Clear the line one last time so the final message is clean
        process.stdout.write(`\r\x1B[2K${symbol} Peer ${this.ip}:${this.port} - ${status.toUpperCase()}\n`);


    }

}