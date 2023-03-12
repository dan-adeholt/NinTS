import { Dispatch, NamedExoticComponent, SetStateAction } from 'react';
import { BaseDialogProps } from './Dialog';
import EmulatorState from './emulator/EmulatorState';
import { KeyListener, RunModeType } from './App';
import CPUDebugger from './components/CPUDebugger';
import PPUNameTableDebugger from './components/PPUNameTableDebugger';
import PPUSpritesDebugger from './components/PPUSpritesDebugger';
import PPUOAMDebugger from './components/PPUOAMDebugger';
import PPUVRAMDebugger from './components/PPUVRAMDebugger';
import PPUScanlineDebugger from './components/PPUScanlineDebugger';
import CompareTraceDebugger from './components/CompareTraceDebugger';
import Profiler from './components/Profiler';
import APUDebugger from './components/APUDebugger';

export enum DebugDialog {
  CPUDebugger = 'CPU Debugger',
  APUDebugger = 'APU Debugger',
  PPUNametables = 'PPU Nametables',
  PPUSprites = 'PPU Sprites',
  PPUOAM = 'PPU OAM',
  VRAMDebugger = 'VRAM Debugger',
  PPUScanlines = 'PPU Scanlines',
  CompareTrace = 'CompareTrace',
  Profiler = 'Profiler'
}

export type DebugDialogProps = BaseDialogProps & {
  emulator: EmulatorState
  runMode: RunModeType,
  setRunMode: (runMode: RunModeType) => void
  onRefresh: () => void
  refresh: number
  addKeyListener: (handler: KeyListener) => void
  removeKeyListener: (handler: KeyListener) => void
  breakpoints: Map<number, boolean>
  setBreakpoints: Dispatch<SetStateAction<Map<number, boolean>>>
}

// // NamedExoticComponent is because we React.memo all the debug dialogs
// Function instead of constant so that HMR works
export const getDebugDialogComponents = (): Record<string, NamedExoticComponent<DebugDialogProps>> => ({
  [DebugDialog.CPUDebugger]: CPUDebugger,
  [DebugDialog.APUDebugger]: APUDebugger,
  [DebugDialog.PPUNametables]: PPUNameTableDebugger,
  [DebugDialog.PPUSprites]: PPUSpritesDebugger,
  [DebugDialog.PPUOAM]: PPUOAMDebugger,
  [DebugDialog.VRAMDebugger]: PPUVRAMDebugger,
  [DebugDialog.PPUScanlines]: PPUScanlineDebugger,
  [DebugDialog.CompareTrace]: CompareTraceDebugger,
  [DebugDialog.Profiler]: Profiler
});

export const DebugDialogToHotkey : Record<DebugDialog, string> = {
  [DebugDialog.CPUDebugger]: 'F1',
  [DebugDialog.APUDebugger]: 'F2',
  [DebugDialog.PPUNametables]: 'F3',
  [DebugDialog.PPUSprites]: 'F4',
  [DebugDialog.PPUOAM]: 'F5',
  [DebugDialog.VRAMDebugger]: 'F6',
  [DebugDialog.PPUScanlines]: 'F7',
  [DebugDialog.CompareTrace]: 'F8',
  [DebugDialog.Profiler]: 'F9',
}

export const HotkeyToDebugDialog: Record<string, DebugDialog> = {};

Object.entries(DebugDialogToHotkey).forEach(([key, value]) => {
  HotkeyToDebugDialog[value] = key as DebugDialog; // Object.entries loses key
})