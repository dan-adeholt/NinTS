export enum MirroringMode {
  Horizontal = 0,
  Vertical = 1,
  SingleScreenA = 2,
  SingleScreenB = 3,
  FourScreen =4
}

export const mirroringModeToString = (mode : MirroringMode) => {
  switch (mode) {
    case MirroringMode.Horizontal: return 'Horizontal';
    case MirroringMode.Vertical: return 'Vertical';
    case MirroringMode.SingleScreenA: return 'SingleScreenA';
    case MirroringMode.SingleScreenB: return 'SingleScreenB';
    case MirroringMode.FourScreen: return 'FourScreen';
    default: return 'INVALID';
  }
}

export default MirroringMode;
