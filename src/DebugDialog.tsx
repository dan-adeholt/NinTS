import { NamedExoticComponent } from 'react';
import APUDebugger from './components/APUDebugger';
import { BaseDialogProps } from './Dialog';
import EmulatorState from './emulator/EmulatorState';
import { KeyListener, RunModeType } from './App';
import CPUDebugger from './components/CPUDebugger';
import _ from 'lodash';
import PPUNameTableDebugger from './components/PPUNameTableDebugger';
import PPUSpritesDebugger from './components/PPUSpritesDebugger';
import PPUOAMDebugger from './components/PPUOAMDebugger';

export enum DebugDialog {
  CPUDebugger = 'CPU Debugger',
  APUDebugger = 'APU Debugger',
  PPUNametables = 'PPU Nametables',
  PPUSprites = 'PPU Sprites',
  PPUOAM = 'PPU OAM',
  VRAMDebugger = 'VRAM Debugger',
  PPUScanlines = 'PPU Scanlines',
  CompareTrace = 'CompareTrace'
}


export type DebugDialogProps = BaseDialogProps & {
  emulator: EmulatorState
  runMode: RunModeType,
  setRunMode: (runMode: RunModeType) => void
  onRefresh: () => void
  refresh: number
  addKeyListener: (handler: KeyListener) => void
  removeKeyListener: (handler: KeyListener) => void
}

// // NamedExoticComponent is because we React.memo all the debug dialogs
// Function instead of constant so that HMR works
export const getDebugDialogComponents = (): Record<string, NamedExoticComponent<DebugDialogProps>> => ({
  [DebugDialog.APUDebugger]: APUDebugger,
  [DebugDialog.CPUDebugger]: CPUDebugger,
  [DebugDialog.PPUNametables]: PPUNameTableDebugger,
  [DebugDialog.PPUSprites]: PPUSpritesDebugger,
  [DebugDialog.PPUOAM]: PPUOAMDebugger
});

export const DebugDialogHotkeys : Record<string, DebugDialog> = {
  'F1': DebugDialog.CPUDebugger,
  'F2': DebugDialog.APUDebugger,
  'F3': DebugDialog.PPUNametables,
  'F4': DebugDialog.PPUSprites,
  'F5': DebugDialog.PPUOAM
}

export const DebugDialogHotkeysComponents = _.invert(DebugDialogHotkeys);
