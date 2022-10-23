export enum MirroringMode {
  Horizontal = 0,
  Vertical = 1,
  SingleScreenLower = 2,
  SingleScreenUpper = 3,
  FourScreen =4
}

export const mirroringModeToString = (mode : MirroringMode) => {
  switch (mode) {
    case MirroringMode.Horizontal: return 'Horizontal';
    case MirroringMode.Vertical: return 'Vertical';
    case MirroringMode.SingleScreenLower: return 'SingleScreenLower';
    case MirroringMode.SingleScreenUpper: return 'SingleScreenUpper';
    case MirroringMode.FourScreen: return 'FourScreen';
    default: return 'INVALID';
  }
}

export default MirroringMode;
