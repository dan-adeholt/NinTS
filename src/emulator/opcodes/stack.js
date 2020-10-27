import { getAddressAbsolute, P_REG_BREAK, setAlwaysOne, setBreak, setInterrupt, setNegative, setZero } from './utils';
import { hex } from '../stateLogging';

export const registerStack = opcodeHandlers => {
  const offsetSP = (sp, offset) => {
    return (sp + offset) & 0xFF;
  }

  const offsetSPNeg = (sp, offset) => {
    return offsetSP(sp, (offset ^ 0xFF) + 1);
  }

  opcodeHandlers[0x0] = state => { // BRK
    const pCopy = state.P | P_REG_BREAK;

    const addr = state.PC + 2; // Next instruction - 1
    state.setStack(state.SP, addr >> 8);
    state.setStack(offsetSPNeg(state.SP, 1), addr & 0xFF);
    state.setStack(offsetSPNeg(state.SP, 2), pCopy);
    state.SP = offsetSPNeg(state.SP, 3);
    setInterrupt(state, true);
    state.PC = state.readMem(0xFFFE) + (state.readMem(0xFFFF) << 8);
    state.CYC += 7;
  }

  opcodeHandlers[0x08] = state => { // PHP
    const pCopy = state.P | P_REG_BREAK;
    state.setStack(state.SP, pCopy);
    state.SP = offsetSPNeg(state.SP, 1);
    state.PC += 1;
    state.CYC += 3;
  };

  opcodeHandlers[0x48] = state => { // PHA
    state.setStack(state.SP, state.A);
    state.SP = offsetSPNeg(state.SP, 1);
    state.PC += 1;
    state.CYC += 3;
  };

  opcodeHandlers[0x28] = state => { // PLP
    state.P = state.readStack(offsetSP(state.SP, 1));
    setBreak(state, false); // See http://wiki.nesdev.com/w/index.php/Status_flags
    setAlwaysOne(state);
    state.SP = offsetSP(state.SP, 1);
    state.PC += 1;
    state.CYC += 4;
  };

  opcodeHandlers[0x40] = state => { // RTI
    state.P = state.readStack(offsetSP(state.SP, 1));
    setBreak(state, false); // See http://wiki.nesdev.com/w/index.php/Status_flags
    setAlwaysOne(state);
    const low = state.readStack(offsetSP(state.SP, 2));
    const high = state.readStack(offsetSP(state.SP, 3));


    state.SP = offsetSP(state.SP, 3);
    state.PC = (low | (high << 8));

    state.CYC += 6;
  }

  opcodeHandlers[0x68] = state => { // PLA
    state.A = state.readStack(offsetSP(state.SP, 1));
    state.SP = offsetSP(state.SP, 1);
    state.PC += 1;
    setZero(state, state.A);
    setNegative(state, state.A);
    state.CYC += 4;
  };

  opcodeHandlers[0x20] = state => { // JSR
    const addr = state.PC + 2; // Next instruction - 1
    state.setStack(state.SP, addr >> 8);
    state.setStack(offsetSPNeg(state.SP, 1), addr & 0xFF);
    state.SP = offsetSPNeg(state.SP, 2);
    state.PC = getAddressAbsolute(state);
    state.CYC += 6;
  };

  opcodeHandlers[0x60] = state => { // RTS
    const low = state.readStack(offsetSP(state.SP, 1));
    const high = state.readStack(offsetSP(state.SP, 2));
    state.SP = offsetSP(state.SP, 2);
    state.PC = (low | (high << 8)) + 1;
    state.CYC += 6;
  };
}
