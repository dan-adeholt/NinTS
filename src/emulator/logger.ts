class Logger {
  lines: string[] = [];

  getLines() {
    return this.lines;
  }

  clear() {
    if (this.lines.length > 0) {
      this.lines = [];
    }
  }

  log(message: string) {
    this.lines.push(message);
  }
}

const loggerInstance = new Logger();

export default loggerInstance;
