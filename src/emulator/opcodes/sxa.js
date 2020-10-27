import { s_a } from './sya';

const sxa = (state) => s_a(state, state.Y, state.X)

export const registerSXA = opcodeHandlers => {
  opcodeHandlers[0x9E] = state => sxa(state)
}
