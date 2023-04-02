import CPUMemorySpace from "./CPUMemorySpace";
import PPUMemorySpace from "./PPUMemorySpace";

class Mapper {
    cpuMemory: CPUMemorySpace
    ppuMemory: PPUMemorySpace
    irq = false

    constructor(cpuMemory: CPUMemorySpace, ppuMemory: PPUMemorySpace) {
        this.cpuMemory = cpuMemory;
        this.ppuMemory = ppuMemory;
    }

    reload() {
      this.irq = false;
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function,@typescript-eslint/no-unused-vars
    handleROMWrite(address: number, value: number) {

    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function,@typescript-eslint/no-unused-vars        
    handleVRAMAddressChange(address: number, scanline: number, scanlineCycle: number) {

    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function,@typescript-eslint/no-unused-vars    
    writePPUMemory(address: number, value: number, _scanline: number, scanlineCycle: number) {
      return this.ppuMemory.write(address, value);
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function,@typescript-eslint/no-unused-vars    
    readPPUMemory(address: number, _scanline: number, scanlineCycle: number) {
      return this.ppuMemory.read(address);
    }
}

export default Mapper;
