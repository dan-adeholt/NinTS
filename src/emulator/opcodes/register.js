import { setNegative, setZero } from './utils';

const setPrelude = (state, value) => {
  setZero(state, value);
  setNegative(state, value);
  state.CYC += 2;
  state.PC += 1;
}

const setY = (state, value) => {
  state.Y = value;
  setPrelude(state, value);
}

const setX = (state, value) => {
  state.X = value;
  setPrelude(state, value);
}

const setA = (state, value) => {
  state.A = value;
  setPrelude(state, value);
}

const setSP = (state, value) => {
  state.SP = value;
  state.CYC += 2;
  state.PC += 1;
}

export const registerRegister = opcodeHandlers => {
  opcodeHandlers[0xC8] = state => setY(state, (state.Y + 1) & 0xFF) // INY
  opcodeHandlers[0x88] = state => setY(state, (state.Y - 1) & 0xFF) // DEY
  opcodeHandlers[0xA8] = state => setY(state, state.A) // TAY

  opcodeHandlers[0xE8] = state => setX(state, (state.X + 1) & 0xFF) // INX
  opcodeHandlers[0xCA] = state => setX(state, (state.X - 1) & 0xFF) // DEX
  opcodeHandlers[0xAA] = state => setX(state, state.A) // TAX
  opcodeHandlers[0xBA] = state => setX(state, state.SP) // TSX

  opcodeHandlers[0x8A] = state => setA(state, state.X) // TXA
  opcodeHandlers[0x98] = state => setA(state, state.Y) // TYA

  opcodeHandlers[0x9A] = state => setSP(state, state.X) // TXS
}
