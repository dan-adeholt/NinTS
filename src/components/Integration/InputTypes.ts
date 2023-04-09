import { INPUT_A, INPUT_B, INPUT_DOWN, INPUT_LEFT, INPUT_RIGHT, INPUT_SELECT, INPUT_START, INPUT_UP } from '../../emulator/EmulatorState';

export enum BindingType {
  GAMEPAD = 'gamepad',
  KEYBOARD = 'keyboard'  
}

export type KeyboardBinding = {
  character: string  
  controller: number
  button: number
}

export type GamepadControllerBinding = {
  controller: number  
  button: number
  gamepadButton: number
  gamepad: number
}

export type ControllerConfig = Record<number, KeyboardBinding | GamepadControllerBinding>

export type InputConfig = {
  gamepadBindings: GamepadControllerBinding[]
  keyboardBindings: KeyboardBinding[]
}

const NumGamepadButtonBits = 8;
export const GamepadButtonMask = (1 << NumGamepadButtonBits) - 1;

export const getGamepadIndexFromButton = (button: number, gamepad: number) => {
  return button | (gamepad << NumGamepadButtonBits);
}

export const defaultInputConfig: InputConfig = {
  gamepadBindings: [
    { button: INPUT_UP, controller: 0, gamepadButton: 15, gamepad: 0 },
    { button: INPUT_LEFT, controller: 0, gamepadButton: 14, gamepad: 0 },
    { button: INPUT_DOWN, controller: 0, gamepadButton: 13, gamepad: 0 },
    { button: INPUT_RIGHT, controller: 0, gamepadButton: 12, gamepad: 0 },
    { button: INPUT_A, controller: 0, gamepadButton: 1, gamepad: 0 },
    { button: INPUT_B, controller: 0, gamepadButton: 3, gamepad: 0 },
    { button: INPUT_SELECT, controller: 0, gamepadButton: 9, gamepad: 0 },
    { button: INPUT_START, controller: 0, gamepadButton: 8, gamepad: 0 }
  ],
  keyboardBindings: [
   { button: INPUT_UP, controller: 0, character: 'w' },
   { button: INPUT_LEFT, controller: 0, character: 'a' },
   { button: INPUT_DOWN, controller: 0, character: 's' },
   { button: INPUT_RIGHT, controller: 0, character: 'd' },
   { button: INPUT_A, controller: 0, character: ' ' },
   { button: INPUT_B, controller: 0, character: 'm' },
   { button: INPUT_SELECT, controller: 0, character: '.' },
   { button: INPUT_START, controller: 0, character: '-' }
  ]
}  
