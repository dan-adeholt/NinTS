const BANK_SIZE = 1024;
const BANK_INDEX_MASK = 0b1111111111;
const BANK_INDEX_SIZE = 10;
const BANK_MASK = ~BANK_INDEX_MASK;

class MemorySpace {
  banks: Uint8Array[] = []
  length = 0;

  constructor(size) {
    const numBanks = size / BANK_SIZE;
    this.length = size;

    for (let i = 0; i < numBanks; i++) {
      this.banks.push(new Uint8Array(BANK_SIZE));
    }
  }

  map(source, targetAddress, start, end) {
    const size = end - start;
    console.assert(size % BANK_SIZE === 0);
    console.assert(targetAddress % BANK_SIZE === 0);
    console.assert(size > 0);
    console.assert(end <= source.length);

    const startIndex = targetAddress / BANK_SIZE;
    const numBanks = size / BANK_SIZE;

    for (let i = 0; i < numBanks; i++) {
      this.banks[i + startIndex] = source.subarray(start + (i * BANK_SIZE), start + (( i+ 1) * BANK_SIZE));
    }
  }

  read(address) {

    const subIndex = address & BANK_INDEX_MASK;
    const bankIndex = (address & BANK_MASK) >> BANK_INDEX_SIZE;

    const ret = this.banks[bankIndex][subIndex];

    if (ret === undefined) {
      console.error('Got error while reading memory bank', bankIndex, ',', subIndex)
    }

    return ret;
  }

  write(address, value) {
    const subIndex = address & BANK_INDEX_MASK;
    const bankIndex = (address & BANK_MASK) >> BANK_INDEX_SIZE;

    this.banks[bankIndex][subIndex] = value;
  }
}

export default MemorySpace;
