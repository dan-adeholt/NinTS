import { hex } from './stateLogging';
import opcodeMetadata from './opcodeMetadata';

import { registerLDX } from './opcodes/ldx';
import { registerLDA } from './opcodes/lda';
import { registerBranch } from './opcodes/branch';
import { registerSTA } from './opcodes/sta';
import { registerSTX } from './opcodes/stx';
import { registerJump } from './opcodes/jump';
import { registerSTY } from './opcodes/sty';
import { registerLDY } from './opcodes/ldy';
import { registerORA } from './opcodes/ora';
import { registerAND } from './opcodes/and';
import { registerClear } from './opcodes/clear';
import { registerEOR } from './opcodes/eor';
import { registerADC } from './opcodes/adc';
import { registerCMP } from './opcodes/cmp';
import { registerCPX } from './opcodes/cpx';
import { registerCPY } from './opcodes/cpy';
import { registerSBC } from './opcodes/sbc';
import { registerRegister } from './opcodes/register';
import { registerStack } from './opcodes/stack';
import { registerLSR } from './opcodes/lsr';
import { registerSet } from './opcodes/set';
import { registerBIT } from './opcodes/bit';
import { registerASL } from './opcodes/asl';
import { registerNOP } from './opcodes/nop';
import { registerROR } from './opcodes/ror';
import { registerROL } from './opcodes/rol';
import { registerINC } from './opcodes/inc';
import { registerDEC } from './opcodes/dec';
import { registerLAX } from './opcodes/lax';
import { registerSAX } from './opcodes/sax';
import { registerDCP } from './opcodes/dcp';
import { registerISB } from './opcodes/isb';
import { registerSLO } from './opcodes/slo';
import { registerRLA } from './opcodes/rla';
import { registerSRE } from './opcodes/sre';
import { registerRRA } from './opcodes/rra';
import { getResetVectorAddress } from './opcodes/utils';
import { registerAAC } from './opcodes/aac';
import { registerASR } from './opcodes/asr';
import { registerARR } from './opcodes/arr';
import { registerATX } from './opcodes/atx';
import { registerAXS } from './opcodes/axs';
import { registerSXA } from './opcodes/sxa';
import { registerSYA } from './opcodes/sya';

const opcodeHandlers = new Array(255);

registerCMP(opcodeHandlers);
registerCPX(opcodeHandlers);
registerCPY(opcodeHandlers);
registerClear(opcodeHandlers);
registerAND(opcodeHandlers);
registerADC(opcodeHandlers);
registerSBC(opcodeHandlers);
registerEOR(opcodeHandlers);
registerLDA(opcodeHandlers);
registerLDX(opcodeHandlers);
registerLDY(opcodeHandlers);
registerSTA(opcodeHandlers);
registerSTX(opcodeHandlers);
registerSTY(opcodeHandlers);
registerBranch(opcodeHandlers);
registerJump(opcodeHandlers);
registerRegister(opcodeHandlers);
registerORA(opcodeHandlers);
registerStack(opcodeHandlers);
registerLSR(opcodeHandlers);
registerSet(opcodeHandlers);
registerBIT(opcodeHandlers);
registerASL(opcodeHandlers);
registerNOP(opcodeHandlers);
registerROR(opcodeHandlers);
registerROL(opcodeHandlers);
registerINC(opcodeHandlers);
registerDEC(opcodeHandlers);
registerLAX(opcodeHandlers);
registerSAX(opcodeHandlers);
registerDCP(opcodeHandlers);
registerISB(opcodeHandlers);
registerSLO(opcodeHandlers);
registerRLA(opcodeHandlers);
registerSRE(opcodeHandlers);
registerRRA(opcodeHandlers);
registerAAC(opcodeHandlers);
registerASR(opcodeHandlers);
registerARR(opcodeHandlers);
registerATX(opcodeHandlers);
registerAXS(opcodeHandlers);
registerSXA(opcodeHandlers);
registerSYA(opcodeHandlers);

console.log(opcodeHandlers.filter(x => x!= null).length, 'opcodes handled');

export const initMachine = (rom) => {
  let memory = new Uint8Array(1 << 16);
  memory.set(rom.prgData, 0x8000);

  if (rom.prgData.length <= 0x4000) {
    memory.set(rom.prgData, 0xC000);
  }

  memory[0x4015] = 0xFF;
  memory[0x4004] = 0xFF;
  memory[0x4005] = 0xFF;
  memory[0x4006] = 0xFF;
  memory[0x4007] = 0xFF;


  // PPU Registers
  memory[0x2000] = 0xFF;
  memory[0x2001] = 0xFF;
  memory[0x2002] = 0xFF;
  memory[0x2003] = 0xFF;
  memory[0x2004] = 0xFF;
  memory[0x2005] = 0xFF;
  memory[0x2006] = 0xFF;
  memory[0x2007] = 0xFF;

  // Reset vector
  const startingLocation = memory[0xFFFC] + (memory[0xFFFD] << 8);

  return {
    A: 0,
    X: 0,
    Y: 0,
    P: 0x24,
    PC: startingLocation,
    SP: 0xFD,
    CYC: 0,
    CHR: rom.chrData,
    settings: rom.settings,
    readStack: sp => memory[0x100 + sp],
    setStack: (sp, value) => {
      memory[0x100 + sp] = value;
    },
    readMem: addr => memory[addr],
    setMem: (addr, value) => {
      memory[addr] = value;
    },
    PPU_CYC: 0,
    memory,
  };
}

export const reset = (state) => {
  const startingLocation = getResetVectorAddress(state);
  state.PC = startingLocation;
}

const updatePPU = (state, cycles) => {
  state.PPU_CYC += cycles * 3;
}

export const step = (state) => {
  const opcode = state.readMem(state.PC);
  const oldCycles = state.CYC;
  if (opcode in opcodeHandlers) {
    // console.log('Executing $' + hex(opcode));
    opcodeHandlers[opcode](state);
  } else {

    console.error('No handler found for opcode $' + hex(opcode === undefined ? -1 : opcode), opcodeMetadata[opcode]?.name ?? '', hex(state.PC));

    return false;
  }

  const executedCycles = state.CYC - oldCycles;
  updatePPU(state, executedCycles);

  return true;
};
