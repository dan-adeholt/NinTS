import EmulatorBreakState from '../EmulatorBreakState';

const BANK_SIZE = 1024;
const BANK_INDEX_MASK = 0b1111111111;
const BANK_INDEX_SIZE = 10;
const BANK_MASK = ~BANK_INDEX_MASK;

class MemorySpace {
  banks: Uint8Array[] = []
  mappedBanks: boolean[] = []
  length = 0;

  constructor(size : number) {
    const numBanks = size / BANK_SIZE;
    this.length = size;

    for (let i = 0; i < numBanks; i++) {
      this.banks.push(new Uint8Array(BANK_SIZE));
      this.mappedBanks.push(false);
    }
  }

  map(source: Uint8Array, targetAddress: number, start: number, end: number) {
    const size = end - start;
    console.assert(size % BANK_SIZE === 0);
    console.assert(targetAddress % BANK_SIZE === 0);
    console.assert(size > 0);

    if (end > source.length) {
      console.error('Mapper tried to map beyond available memory', end, '>', source.length);
      EmulatorBreakState.break = true;
    }

    console.assert(end <= source.length);

    const startIndex = targetAddress / BANK_SIZE;
    const numBanks = size / BANK_SIZE;

    for (let i = 0; i < numBanks; i++) {
      this.banks[i + startIndex] = source.subarray(start + (i * BANK_SIZE), start + (( i+ 1) * BANK_SIZE));
      this.mappedBanks[i + startIndex] = true;
    }
  }

  read(address: number, openBusValue: number) {
    const subIndex = address & BANK_INDEX_MASK;
    const bankIndex = (address & BANK_MASK) >> BANK_INDEX_SIZE;

    if (!this.mappedBanks[bankIndex]) {
      return openBusValue;
    }

    const ret = this.banks[bankIndex][subIndex];

    if (ret === undefined) {
      console.error('Got error while reading memory bank', bankIndex, ',', subIndex)
      EmulatorBreakState.break = true;
    }

    return ret;
  }

  write(address: number, value: number) {
    const subIndex = address & BANK_INDEX_MASK;
    const bankIndex = (address & BANK_MASK) >> BANK_INDEX_SIZE;

    this.banks[bankIndex][subIndex] = value;
  }
}

export default MemorySpace;
