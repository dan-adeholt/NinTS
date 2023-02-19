import React from 'react';
import { hex } from '../emulator/stateLogging';
import { DebugDialogProps } from '../DebugDialog';
import Dialog, { DialogHorizontalPosition } from '../Dialog';
import classNames from 'classnames';
import styles from './APUDebugger.module.css';
import SquareWaveGenerator from '../emulator/apu/SquareWaveGenerator';
import LengthCounter from '../emulator/apu/LengthCounter';
import TriangleWaveGenerator from '../emulator/apu/TriangleWaveGenerator';
import EnvelopeGenerator from '../emulator/apu/EnvelopeGenerator';
import NoiseGenerator from '../emulator/apu/NoiseGenerator';
import DMCGenerator from '../emulator/apu/DMCGenerator';

const boolValue = (value: boolean) => value ? 'true' : 'false'

type SquareUnitDebuggerProps = {
  squareUnit: SquareWaveGenerator
}

type LengthCounterDebuggerProps = {
  lengthCounter: LengthCounter
}

type EnvelopeDebuggerProps = {
  envelope: EnvelopeGenerator
}

const EnvelopeDebugger = ({ envelope } : EnvelopeDebuggerProps) => {
  return (
    <div>
        Envelope
        <dl>
          <dt>Start</dt>
          <dd>{boolValue(envelope.envelopeStartFlag)}</dd>
          <dt>Loop</dt>
          <dd>{boolValue(envelope.envelopeLoop)}</dd>
          <dt>Constant volume</dt>
          <dd>{boolValue(envelope.constantVolume)}</dd>
          <dt>Counter</dt>
          <dd>{envelope.decayLevelCounter}</dd>
          <dt>Divider</dt>
          <dd>{envelope.envelopeDividerPeriod}</dd>
          <dt>Volume/Period</dt>
          <dd>{envelope.envelopePeriodOrVolume}</dd>
        </dl>
      </div>
  );
}

const LengthCounterDebugger = ({ lengthCounter } : LengthCounterDebuggerProps) => {
  return (
    <div>
      Length counter
      <dl>
        <dt>Halt</dt>
        <dd>{boolValue(lengthCounter.haltCounter)}</dd>
        <dt>Counter</dt>
        <dd>{lengthCounter.lengthCounter}</dd>
        <dt>Reload value</dt>
        <dd>{lengthCounter.reloadValue}</dd>
      </dl>
    </div>
  );
}

const SquareUnitDebugger = ({ squareUnit } : SquareUnitDebuggerProps) => {
  return (
    <div className={styles.innerContainer}>
      <div>
        Square { squareUnit.index + 1 }
        <dl>
          <dt>Enabled</dt>
          <dd>{boolValue(squareUnit.isEnabled)}</dd>
          <dt>Period</dt>
          <dd>{squareUnit.timerSetting}</dd>
          <dt>Timer</dt>
          <dd>{squareUnit.timerValue}</dd>
          <dt>Duty cycle</dt>
          <dd>{squareUnit.dutyCycle}</dd>
          <dt>Duty Position</dt>
          <dd>{squareUnit.generatorIndex}</dd>
          <dt>Output volume</dt>
          <dd>{squareUnit.curOutputValue}</dd>
        </dl>
      </div>
      <div>
        Sweep
        <dl>
          <dt>Enabled</dt>
          <dd>{boolValue(squareUnit.sweepEnabled)}</dd>
          <dt>Negate</dt>
          <dd>{boolValue(squareUnit.sweepNegate)}</dd>
          <dt>Period</dt>
          <dd>{squareUnit.sweepPeriod}</dd>
          <dt>Shift</dt>
          <dd>{squareUnit.sweepShift}</dd>
        </dl>
      </div>
      <EnvelopeDebugger envelope={squareUnit.envelope}/>
      <LengthCounterDebugger lengthCounter={squareUnit.lengthCounter}/>
    </div>
  );
}

type TriangleDebuggerProps = {
  triangle: TriangleWaveGenerator
}

const TriangleDebugger = ({ triangle } : TriangleDebuggerProps) => {
  return (
    <div className={styles.innerContainer}>
      <div>
        Triangle     
        <dl>
          <dt>Enabled</dt>
          <dd>{boolValue(triangle.isEnabled)}</dd>
          <dt>Period</dt>
          <dd>{triangle.timerSetting}</dd>
          <dt>Timer</dt>
          <dd>{triangle.timerValue}</dd>
          <dt>Sequence index</dt>
          <dd>{triangle.generatorIndex}</dd>
          <dt>Output</dt>
          <dd>{triangle.curOutputValue}</dd>
        </dl>
      </div>
      <LengthCounterDebugger lengthCounter={triangle.lengthCounter}/>
    </div>
  );
};

type NoiseDebuggerProps = {
  noiseGenerator: NoiseGenerator
}

const NoiseDebugger = ({ noiseGenerator } : NoiseDebuggerProps) => {
  return (
    <div className={styles.innerContainer}>
      <div>
        Noise
        <dl>
          <dt>Enabled</dt>
          <dd>{boolValue(noiseGenerator.isEnabled)}</dd>
          <dt>Mode</dt>
          <dd>{noiseGenerator.mode}</dd>
          <dt>Period</dt>
          <dd>{noiseGenerator.timerSetting}</dd>
          <dt>Timer</dt>
          <dd>{noiseGenerator.timerValue}</dd>
          <dt>Shift register</dt>
          <dd>{hex(noiseGenerator.shiftRegister)}</dd>
          <dt>Output</dt>
          <dd>{noiseGenerator.curOutputValue}</dd>
        </dl>
      </div>
      <EnvelopeDebugger envelope={noiseGenerator.envelope}/>
      <LengthCounterDebugger lengthCounter={noiseGenerator.lengthCounter}/>
    </div>
  );
}

type DMCDebuggerProps = {
  dmc: DMCGenerator
}

const DMCDebugger = ({ dmc } : DMCDebuggerProps) => {
  return (
    <div className={styles.innerContainer}>
      <div>
        Noise
        <dl>
          <dt>Enabled</dt>
          <dd>{boolValue(dmc.settings.isEnabled)}</dd>
          <dt>Loop</dt>
          <dd>{boolValue(dmc.settings.loop)}</dd>
          <dt>IRQ enabled</dt>
          <dd>{boolValue(dmc.settings.irqEnabled)}</dd>
          <dt>Period</dt>
          <dd>{dmc.clock.period}</dd>
          <dt>Timer</dt>
          <dd>{dmc.clock.timer}</dd>

        </dl>
      </div>
      <div>
        Noise 
        <dl>
          <dt>Output</dt>
          <dd>{dmc.output.counter}</dd>  
          <dt>Sample address</dt>
          <dd>{dmc.reader.currentAddress}</dd>
          <dt>Sample length</dt>
          <dd>{dmc.settings.sampleLength}</dd>
          <dt>Remaining bytes</dt>
          <dd>{dmc.reader.remainingBytes}</dd>
        </dl>
      </div>
    </div>
  );
}

const APUDebugger = ({ emulator, isOpen, onClose }: DebugDialogProps) => {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="APU Debugger"
      horizontalPosition={DialogHorizontalPosition.RIGHT}>
      <div className={styles.container}>
        <div className={classNames(styles.square1, styles.channel)}>
          <SquareUnitDebugger squareUnit={emulator.apu.square1}/>
        </div>
        <div className={classNames(styles.square2, styles.channel)}>
          <SquareUnitDebugger squareUnit={emulator.apu.square2} />
        </div>
        <div className={classNames(styles.triangle, styles.channel)}>
          <TriangleDebugger triangle={emulator.apu.triangle}/>
        </div>
        <div className={classNames(styles.noise, styles.channel)}>
          <NoiseDebugger noiseGenerator={emulator.apu.noise}/>
        </div>
        <div className={classNames(styles.dmc, styles.channel)}>
          <DMCDebugger dmc={emulator.apu.dmc}/>
        </div>
      </div>
    </Dialog>);
}

export default React.memo(APUDebugger);