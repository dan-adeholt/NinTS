import EmulatorState, { INPUT_DOWN, INPUT_LEFT, INPUT_RIGHT, INPUT_UP } from '../../emulator/EmulatorState';
import { GamepadControllerBinding, getGamepadIndexFromButton } from './InputTypes';

// Feeds the current state of all connected gamepads into the emulator. The left
// analog stick is mapped onto whichever buttons are bound to the d-pad directions.
const pollGamepads = (emulator: EmulatorState, gamepadLookup: Map<number, GamepadControllerBinding>) => {
  for (const gamepad of navigator.getGamepads()) {
    if (gamepad == null) {
      continue;
    }

    const a0 = gamepad.axes[0];
    const a1 = gamepad.axes[1];
    const deg = Math.atan2(Math.abs(a0), Math.abs(a1)) / Math.PI;

    for (let buttonIndex = 0; buttonIndex < gamepad.buttons.length; buttonIndex++) {
      const config = gamepadLookup.get(getGamepadIndexFromButton(buttonIndex, gamepad.index));
      if (config == null) {
        continue;
      }

      let isPressed = gamepad.buttons[buttonIndex].pressed;

      switch (config.button) {
        case INPUT_RIGHT:
          isPressed = isPressed || (a0 > 0 && deg >= 0.125);
          break;
        case INPUT_LEFT:
          isPressed = isPressed || (a0 < 0 && deg >= 0.125);
          break;
        case INPUT_UP:
          isPressed = isPressed || (a1 < 0 && deg <= 0.325);
          break;
        case INPUT_DOWN:
          isPressed = isPressed || (a1 > 0 && deg <= 0.325);
          break;
      }

      emulator.setInputController(config.button, isPressed, config.controller);
    }
  }
}

export default pollGamepads;
