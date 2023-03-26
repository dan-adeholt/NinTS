export default class FIFOBuffer {
  private buffer: number[]
  maxValue = 0
  compareFunction: (a: number, b: number) => number

  constructor(size: number, compareFunction: (a: number, b: number) => number = Math.max) {
    this.buffer = new Array(size);  
    this.compareFunction = compareFunction;
    for (let i = 0; i < this.buffer.length; i++) {
      this.buffer[i] = 0;
    }
  }

  public push(value: number) {
    this.maxValue = this.buffer[1];
    for (let i = 1; i < this.buffer.length; i++) {
      this.buffer[i - 1] = this.buffer[i];
      this.maxValue = this.compareFunction(this.maxValue, this.buffer[i - 1]);
    }
    this.buffer[this.buffer.length - 1] = value;
    this.maxValue = this.compareFunction(this.maxValue, value);
  }
}