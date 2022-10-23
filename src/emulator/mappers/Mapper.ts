import CPUMemorySpace from "./CPUMemorySpace";
import PPUMemorySpace from "./PPUMemorySpace";

class Mapper {
    cpuMemory: CPUMemorySpace
    ppuMemory: PPUMemorySpace

    constructor(cpuMemory, ppuMemory) {
        this.cpuMemory = cpuMemory;
        this.ppuMemory = ppuMemory;
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    reload() {

    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function,@typescript-eslint/no-unused-vars
    handleROMWrite(address, value) {

    }
}

export default Mapper;
