/**
 * Register update instructions.
 */
import EmulatorState from '../EmulatorState';
import { setA, Setter, setX, setY, setZeroNegative } from './util';

const writeRegister = (state : EmulatorState, value: number, setter: Setter) => {
  state.startReadTick();
  setZeroNegative(state, value);
  setter(state, value);
  state.endReadTick();
}

export const iny = (state : EmulatorState) => writeRegister(state, (state.Y + 1) & 0xFF, setY);
export const dey = (state : EmulatorState) => writeRegister(state, (state.Y - 1) & 0xFF, setY);
export const tay = (state : EmulatorState) => writeRegister(state, state.A, setY);
export const inx = (state : EmulatorState) => writeRegister(state, (state.X + 1) & 0xFF, setX)
export const dex = (state : EmulatorState) => writeRegister(state, (state.X - 1) & 0xFF, setX)
export const tax = (state : EmulatorState) => writeRegister(state, state.A, setX);
export const tsx = (state : EmulatorState) => writeRegister(state, state.SP, setX)
export const txa = (state : EmulatorState) => writeRegister(state, state.X, setA)
export const tya = (state : EmulatorState) => writeRegister(state, state.Y, setA)

export const txs = (state : EmulatorState) => {
  state.startReadTick();
  state.SP = state.X;
  state.endReadTick();
}
