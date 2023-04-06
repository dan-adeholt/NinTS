import { INPUT_A, INPUT_B, INPUT_DOWN, INPUT_LEFT, INPUT_RIGHT, INPUT_SELECT, INPUT_START, INPUT_UP } from '../../emulator/EmulatorState';
export enum BindingType {
  GAMEPAD = 'gamepad',
  KEYBOARD = 'keyboard'  
}

export type KeyboardBinding = {
  controller: number
  button: number
}

export type GamepadControllerBinding = {
  controller: number  
  button: number
}

export type ControllerConfig = Record<number, KeyboardBinding | GamepadControllerBinding>

export type InputConfig = {
  gamepadBindings: Record<number, GamepadControllerBinding>[]
  keyboardBindings: Record<string, KeyboardBinding>
}

export const defaultInputConfig: InputConfig = {
  gamepadBindings: [{
    15: { button: INPUT_UP, controller: 0 },
    14: { button: INPUT_LEFT, controller: 0 },
    13: { button: INPUT_DOWN, controller: 0 },
    12: { button: INPUT_RIGHT, controller: 0 },
    1: { button: INPUT_A, controller: 0 },
    3: { button: INPUT_B, controller: 0 },
    9: { button: INPUT_SELECT, controller: 0 },
    8: { button: INPUT_START, controller: 0 }
  },
    {}],
  keyboardBindings: {
    'w': { button: INPUT_UP, controller: 0 },
    'a': { button: INPUT_LEFT, controller: 0 },
    's': { button: INPUT_DOWN, controller: 0 },
    'd': { button: INPUT_RIGHT, controller: 0 },
    ' ': { button: INPUT_A, controller: 0 },
    'm': { button: INPUT_B, controller: 0 },
    '.': { button: INPUT_SELECT, controller: 0 },
    '-': { button: INPUT_START, controller: 0 }
  } 
}  
