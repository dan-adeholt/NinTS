import CPUMemorySpace from "./CPUMemorySpace";
import PPUMemorySpace from "./PPUMemorySpace";

class Mapper {
    cpuMemory: CPUMemorySpace
    ppuMemory: PPUMemorySpace

    constructor(cpuMemory: CPUMemorySpace, ppuMemory: PPUMemorySpace) {
        this.cpuMemory = cpuMemory;
        this.ppuMemory = ppuMemory;
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    reload() {

    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function,@typescript-eslint/no-unused-vars
    handleROMWrite(address: number, value: number) {

    }
}

export default Mapper;
