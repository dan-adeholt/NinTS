/**
 * Register update instructions.
 */
import { setA, setX, setY, setZeroNegative } from './util';

const writeRegister = (state, value, setter) => {
  state.startReadTick();
  setZeroNegative(state, value);
  setter(state, value);
  state.endReadTick();
}

export const iny = state => writeRegister(state, (state.Y + 1) & 0xFF, setY);
export const dey = state => writeRegister(state, (state.Y - 1) & 0xFF, setY);
export const tay = state => writeRegister(state, state.A, setY);
export const inx = state => writeRegister(state, (state.X + 1) & 0xFF, setX)
export const dex = state => writeRegister(state, (state.X - 1) & 0xFF, setX)
export const tax = state => writeRegister(state, state.A, setX);
export const tsx = state => writeRegister(state, state.SP, setX)
export const txa = state => writeRegister(state, state.X, setA)
export const tya = state => writeRegister(state, state.Y, setA)

export const txs = state => {
  state.startReadTick();
  state.SP = state.X;
  state.endReadTick();
}
