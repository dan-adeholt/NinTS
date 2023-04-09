import React, { useMemo, Dispatch, SetStateAction, useState, useEffect } from 'react';
import Dialog, { DialogVerticalPosition } from './Dialog';
import { GamepadControllerBinding, InputConfig, KeyboardBinding } from './Integration/InputTypes';
import { INPUT_A, INPUT_LEFT, INPUT_RIGHT, INPUT_UP, INPUT_SELECT, INPUT_DOWN, INPUT_B, INPUT_START } from '../emulator/EmulatorState';
import styles from './ConfigureControls.module.css';
import classNames from 'classnames';
import { LOCAL_STORAGE_KEY_INPUT_CONFIG } from './types';

const ALL_INPUTS = [ INPUT_UP, INPUT_DOWN, INPUT_LEFT, INPUT_RIGHT, INPUT_A, INPUT_B, INPUT_SELECT, INPUT_START ];
const ALL_INPUTS_NAMES = [ 'Up', 'Down', 'Left', 'Right', 'A', 'B', 'Select', 'Start' ];

type ConfigureControlsProps = {
  onClose: () => void
  inputConfig: InputConfig
  setInputConfig: Dispatch<SetStateAction<InputConfig>>
}

type InputConfigLookupController = {
  gamepad: Record<number, GamepadControllerBinding>
  keyboard: Record<string, KeyboardBinding>
}  

type KeyboardBindingViewProps = {
  binding?: KeyboardBinding
  onClick: () => void
  active: boolean
}

const KeyboardBindingView = ({ binding, onClick, active }: KeyboardBindingViewProps) => {
  let character = binding?.character ?? '';

  if (character === ' ') {
    character = 'Space';
  }
  return (
    <div className={classNames(styles.binding, active && styles.active)} onClick={onClick}>
      <span>{ character }</span>
    </div>
  );
};

type GamepadBindingViewProps = {
  onClick: () => void
  binding?: GamepadControllerBinding
  active: boolean
}

const GamepadBindingView = ({ binding, active, onClick }: GamepadBindingViewProps) => {
  let text = (binding?.gamepadButton == null) ? '' : binding.gamepadButton.toString();

  if (text != '') {
    text = 'Button ' + text;
  }

  return (
    <div className={classNames(styles.binding, active && styles.active)} onClick={onClick}>
      <span>{ text }</span>
    </div>
  );
}

type InputTarget = {
  controller: number
  button: number
}

type ConfigureControlsControllerConfigProps = {
  config: InputConfigLookupController
  index: number
  gamepadTarget: InputTarget | null
  setGamepadTarget: Dispatch<SetStateAction<InputTarget | null>>
  keyboardTarget: InputTarget | null
  setKeyboardTarget: Dispatch<SetStateAction<InputTarget | null>>
}

const ConfigureControlsControllerConfig = ({
  config,
  index,
  keyboardTarget,
  setKeyboardTarget,
  gamepadTarget,
  setGamepadTarget 
} : ConfigureControlsControllerConfigProps) => {
  return (
    <>
      <div className={styles.tableContainer}>
        <h2>Controller {index + 1}</h2>  
        <table>
          <thead>
            <tr>
              <th>Button</th>
              <th>Keyboard</th>
              <th>Gamepad</th>
            </tr>
          </thead>
          <tbody>
            {ALL_INPUTS.map((input, inputIndex) => (
              <tr key={input}>
                <td align='center'>{ALL_INPUTS_NAMES[inputIndex]}</td>
                <td>
                  <KeyboardBindingView
                    binding={config.keyboard[input]}
                    onClick={() => setKeyboardTarget({ button: input, controller: index })}
                    active={keyboardTarget?.button === input && keyboardTarget?.controller === index}
                  />
                </td>
                <td><GamepadBindingView
                  binding={config.gamepad[input]}
                  onClick={() => setGamepadTarget({ button: input, controller: index })}
                  active={gamepadTarget?.button === input && gamepadTarget?.controller === index}
                /> </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
    </>
  );
}

const ConfigureControls = ({ onClose, inputConfig, setInputConfig } : ConfigureControlsProps) => {
  const [keyboardTarget, setKeyboardTarget] = useState<InputTarget | null>(null);
  const [gamepadTarget, setGamepadTarget] = useState<InputTarget | null>(null);
  
  const invertedMapping = useMemo(() => {
    const controllers: InputConfigLookupController[] = [];

    for (let controllerConfig = 0; controllerConfig < 2; controllerConfig++) {
      const gamepadBindings: Record<number, GamepadControllerBinding> = {}
      const keyboardBindings: Record<string, KeyboardBinding> = {}

      for (const binding of inputConfig.gamepadBindings) {
        if (binding.controller === controllerConfig) {
          gamepadBindings[binding.button] = binding;
        }
      }

      for (const binding of inputConfig.keyboardBindings) {
        if (binding.controller === controllerConfig) {
          keyboardBindings[binding.button] = binding;
        }
      }

      controllers.push({
        gamepad: gamepadBindings,
        keyboard: keyboardBindings
      });
    }

    return controllers;    
  }, [inputConfig]);

  useEffect(() => {
    let currentId = 0;

    const gamepadCallback = () => {
      const pads = navigator.getGamepads();

      for (let padIndex = 0; padIndex < pads.length; padIndex++) {
        const pad = pads[padIndex];
        if (pad != null && gamepadTarget != null) {
          for (let buttonIndex = 0; buttonIndex < pad.buttons.length; buttonIndex++) {
            const button = pad.buttons[buttonIndex];
            if (button.pressed) {
              setGamepadTarget(null)
              setInputConfig((oldInputConfig: InputConfig) => {
                const newInputConfig: InputConfig = {
                  gamepadBindings: oldInputConfig.gamepadBindings.filter((binding) => {
                    return binding.controller !== gamepadTarget.controller || binding.button !== gamepadTarget.button;
                  }).concat({
                    button: gamepadTarget.button,
                    controller: gamepadTarget.controller,
                    gamepad: padIndex,
                    gamepadButton: buttonIndex
                  }),
                  keyboardBindings: oldInputConfig.keyboardBindings
                };

                localStorage.setItem(LOCAL_STORAGE_KEY_INPUT_CONFIG, JSON.stringify(newInputConfig));

                return newInputConfig;
              });

              return;
            }
          }
        }
      }

      currentId = window.requestAnimationFrame(gamepadCallback);
    }

    const keyDownCallback = (e : KeyboardEvent) => {
      if (keyboardTarget == null) {
        return;
      }

      setInputConfig(oldInputConfig => {
        const newInputConfig: InputConfig = {
          gamepadBindings: oldInputConfig.gamepadBindings,
          keyboardBindings: oldInputConfig.keyboardBindings.filter((binding) => {
            return binding.controller !== keyboardTarget.controller || binding.button !== keyboardTarget.button;
          }).concat({
            button: keyboardTarget.button,
            controller: keyboardTarget.controller,
            character: e.key,
          })
        }

        localStorage.setItem(LOCAL_STORAGE_KEY_INPUT_CONFIG, JSON.stringify(newInputConfig));
        return newInputConfig;
      });
      setKeyboardTarget(null);
    }

    document.addEventListener("keydown", keyDownCallback);
    currentId = window.requestAnimationFrame(gamepadCallback)

    return () => {
      window.cancelAnimationFrame(currentId);
      document.removeEventListener("keydown", keyDownCallback);
    }
  }, [keyboardTarget, setKeyboardTarget, setInputConfig, gamepadTarget, setGamepadTarget]);

  return (
    <Dialog
      verticalPosition={DialogVerticalPosition.TOP}
      title="Configure controls"
      onClose={onClose}
      fullScreen
    >
      <ConfigureControlsControllerConfig
        config={invertedMapping[0]}
        index={0}
        keyboardTarget={keyboardTarget}
        setKeyboardTarget={setKeyboardTarget}
        gamepadTarget={gamepadTarget}
        setGamepadTarget={setGamepadTarget}
      />
      <ConfigureControlsControllerConfig
        config={invertedMapping[1]}
        index={1}
        keyboardTarget={keyboardTarget}
        setKeyboardTarget={setKeyboardTarget}
        gamepadTarget={gamepadTarget}
        setGamepadTarget={setGamepadTarget}
      />
    </Dialog>
  );
};

export default React.memo(ConfigureControls);
