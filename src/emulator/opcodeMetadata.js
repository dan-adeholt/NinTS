const opcodeMetadata = [
  {
    "name": "BRK",
    "mode": "Implied",
    "instructionSize": "1"
  },
  {
    "name": "ORA",
    "mode": "IndirectX",
    "instructionSize": "2"
  },
  null,
  null,
  null,
  {
    "name": "ORA",
    "mode": "ZeroPage",
    "instructionSize": "2"
  },
  {
    "name": "ASL",
    "mode": "ZeroPage",
    "instructionSize": "2"
  },
  null,
  null,
  {
    "name": "ORA",
    "mode": "Immediate",
    "instructionSize": "2"
  },
  {
    "name": "ASL",
    "mode": "Accumulator",
    "instructionSize": "1"
  },
  null,
  null,
  {
    "name": "ORA",
    "mode": "Absolute",
    "instructionSize": "3"
  },
  {
    "name": "ASL",
    "mode": "Absolute",
    "instructionSize": "3"
  },
  null,
  null,
  {
    "name": "ORA",
    "mode": "IndirectY",
    "instructionSize": "2"
  },
  null,
  null,
  null,
  {
    "name": "ORA",
    "mode": "ZeroPageX",
    "instructionSize": "2"
  },
  {
    "name": "ASL",
    "mode": "ZeroPageX",
    "instructionSize": "2"
  },
  null,
  null,
  {
    "name": "ORA",
    "mode": "AbsoluteY",
    "instructionSize": "3"
  },
  null,
  null,
  null,
  {
    "name": "ORA",
    "mode": "AbsoluteX",
    "instructionSize": "3"
  },
  {
    "name": "ASL",
    "mode": "AbsoluteX",
    "instructionSize": "3"
  },
  null,
  {
    "name": "JSR",
    "mode": "Absolute",
    "instructionSize": "3"
  },
  {
    "name": "AND",
    "mode": "IndirectX",
    "instructionSize": "2"
  },
  null,
  null,
  {
    "name": "BIT",
    "mode": "ZeroPage",
    "instructionSize": "2"
  },
  {
    "name": "AND",
    "mode": "ZeroPage",
    "instructionSize": "2"
  },
  {
    "name": "ROL",
    "mode": "ZeroPage",
    "instructionSize": "2"
  },
  null,
  null,
  {
    "name": "AND",
    "mode": "Immediate",
    "instructionSize": "2"
  },
  {
    "name": "ROL",
    "mode": "Accumulator",
    "instructionSize": "1"
  },
  null,
  {
    "name": "BIT",
    "mode": "Absolute",
    "instructionSize": "3"
  },
  {
    "name": "AND",
    "mode": "Absolute",
    "instructionSize": "3"
  },
  {
    "name": "ROL",
    "mode": "Absolute",
    "instructionSize": "3"
  },
  null,
  null,
  {
    "name": "AND",
    "mode": "IndirectY",
    "instructionSize": "2"
  },
  null,
  null,
  null,
  {
    "name": "AND",
    "mode": "ZeroPageX",
    "instructionSize": "2"
  },
  {
    "name": "ROL",
    "mode": "ZeroPageX",
    "instructionSize": "2"
  },
  null,
  null,
  {
    "name": "AND",
    "mode": "AbsoluteY",
    "instructionSize": "3"
  },
  null,
  null,
  null,
  {
    "name": "AND",
    "mode": "AbsoluteX",
    "instructionSize": "3"
  },
  {
    "name": "ROL",
    "mode": "AbsoluteX",
    "instructionSize": "3"
  },
  null,
  {
    "name": "RTI",
    "mode": "Implied",
    "instructionSize": "1"
  },
  {
    "name": "EOR",
    "mode": "IndirectX",
    "instructionSize": "2"
  },
  null,
  null,
  null,
  {
    "name": "EOR",
    "mode": "ZeroPage",
    "instructionSize": "2"
  },
  {
    "name": "LSR",
    "mode": "ZeroPage",
    "instructionSize": "2"
  },
  null,
  null,
  {
    "name": "EOR",
    "mode": "Immediate",
    "instructionSize": "2"
  },
  {
    "name": "LSR",
    "mode": "Accumulator",
    "instructionSize": "1"
  },
  null,
  {
    "name": "JMP",
    "mode": "Absolute",
    "instructionSize": "3"
  },
  {
    "name": "EOR",
    "mode": "Absolute",
    "instructionSize": "3"
  },
  {
    "name": "LSR",
    "mode": "Absolute",
    "instructionSize": "3"
  },
  null,
  null,
  {
    "name": "EOR",
    "mode": "IndirectY",
    "instructionSize": "2"
  },
  null,
  null,
  null,
  {
    "name": "EOR",
    "mode": "ZeroPageX",
    "instructionSize": "2"
  },
  {
    "name": "LSR",
    "mode": "ZeroPageX",
    "instructionSize": "2"
  },
  null,
  null,
  {
    "name": "EOR",
    "mode": "AbsoluteY",
    "instructionSize": "3"
  },
  null,
  null,
  null,
  {
    "name": "EOR",
    "mode": "AbsoluteX",
    "instructionSize": "3"
  },
  {
    "name": "LSR",
    "mode": "AbsoluteX",
    "instructionSize": "3"
  },
  null,
  {
    "name": "RTS",
    "mode": "Implied",
    "instructionSize": "1"
  },
  {
    "name": "ADC",
    "mode": "IndirectX",
    "instructionSize": "2"
  },
  null,
  null,
  null,
  {
    "name": "ADC",
    "mode": "ZeroPage",
    "instructionSize": "2"
  },
  {
    "name": "ROR",
    "mode": "ZeroPage",
    "instructionSize": "2"
  },
  null,
  null,
  {
    "name": "ADC",
    "mode": "Immediate",
    "instructionSize": "2"
  },
  {
    "name": "ROR",
    "mode": "Accumulator",
    "instructionSize": "1"
  },
  null,
  null,
  {
    "name": "ADC",
    "mode": "Absolute",
    "instructionSize": "3"
  },
  {
    "name": "ROR",
    "mode": "Absolute",
    "instructionSize": "3"
  },
  null,
  null,
  {
    "name": "ADC",
    "mode": "IndirectY",
    "instructionSize": "2"
  },
  null,
  null,
  null,
  {
    "name": "ADC",
    "mode": "ZeroPageX",
    "instructionSize": "2"
  },
  {
    "name": "ROR",
    "mode": "ZeroPageX",
    "instructionSize": "2"
  },
  null,
  null,
  {
    "name": "ADC",
    "mode": "AbsoluteY",
    "instructionSize": "3"
  },
  null,
  null,
  null,
  {
    "name": "ADC",
    "mode": "AbsoluteX",
    "instructionSize": "3"
  },
  {
    "name": "ROR",
    "mode": "AbsoluteX",
    "instructionSize": "3"
  },
  null,
  null,
  {
    "name": "STA",
    "mode": "IndirectX",
    "instructionSize": "2"
  },
  null,
  null,
  {
    "name": "STY",
    "mode": "ZeroPage",
    "instructionSize": "2"
  },
  {
    "name": "STA",
    "mode": "ZeroPage",
    "instructionSize": "2"
  },
  {
    "name": "STX",
    "mode": "ZeroPage",
    "instructionSize": "2"
  },
  null,
  null,
  null,
  null,
  null,
  {
    "name": "STY",
    "mode": "Absolute",
    "instructionSize": "3"
  },
  {
    "name": "STA",
    "mode": "Absolute",
    "instructionSize": "3"
  },
  {
    "name": "STX",
    "mode": "Absolute",
    "instructionSize": "3"
  },
  null,
  null,
  {
    "name": "STA",
    "mode": "IndirectY",
    "instructionSize": "2"
  },
  null,
  null,
  {
    "name": "STY",
    "mode": "ZeroPageX",
    "instructionSize": "2"
  },
  {
    "name": "STA",
    "mode": "ZeroPageX",
    "instructionSize": "2"
  },
  null,
  null,
  null,
  {
    "name": "STA",
    "mode": "AbsoluteY",
    "instructionSize": "3"
  },
  null,
  null,
  null,
  {
    "name": "STA",
    "mode": "AbsoluteX",
    "instructionSize": "3"
  },
  null,
  null,
  {
    "name": "LDY",
    "mode": "Immediate",
    "instructionSize": "2"
  },
  {
    "name": "LDA",
    "mode": "IndirectX",
    "instructionSize": "2"
  },
  {
    "name": "LDX",
    "mode": "Immediate",
    "instructionSize": "2"
  },
  null,
  {
    "name": "LDY",
    "mode": "ZeroPage",
    "instructionSize": "2"
  },
  {
    "name": "LDA",
    "mode": "ZeroPage",
    "instructionSize": "2"
  },
  {
    "name": "LDX",
    "mode": "ZeroPage",
    "instructionSize": "2"
  },
  null,
  null,
  {
    "name": "LDA",
    "mode": "Immediate",
    "instructionSize": "2"
  },
  null,
  null,
  {
    "name": "LDY",
    "mode": "Absolute",
    "instructionSize": "3"
  },
  {
    "name": "LDA",
    "mode": "Absolute",
    "instructionSize": "3"
  },
  {
    "name": "LDX",
    "mode": "Absolute",
    "instructionSize": "3"
  },
  null,
  null,
  {
    "name": "LDA",
    "mode": "IndirectY",
    "instructionSize": "2"
  },
  null,
  null,
  {
    "name": "LDY",
    "mode": "ZeroPageX",
    "instructionSize": "2"
  },
  {
    "name": "LDA",
    "mode": "ZeroPageX",
    "instructionSize": "2"
  },
  null,
  null,
  null,
  {
    "name": "LDA",
    "mode": "AbsoluteY",
    "instructionSize": "3"
  },
  null,
  null,
  {
    "name": "LDY",
    "mode": "AbsoluteX",
    "instructionSize": "3"
  },
  {
    "name": "LDA",
    "mode": "AbsoluteX",
    "instructionSize": "3"
  },
  {
    "name": "LDX",
    "mode": "AbsoluteY",
    "instructionSize": "3"
  },
  null,
  {
    "name": "CPY",
    "mode": "Immediate",
    "instructionSize": "2"
  },
  {
    "name": "CMP",
    "mode": "IndirectX",
    "instructionSize": "2"
  },
  null,
  null,
  {
    "name": "CPY",
    "mode": "ZeroPage",
    "instructionSize": "2"
  },
  {
    "name": "CMP",
    "mode": "ZeroPage",
    "instructionSize": "2"
  },
  {
    "name": "DEC",
    "mode": "ZeroPage",
    "instructionSize": "2"
  },
  null,
  null,
  {
    "name": "CMP",
    "mode": "Immediate",
    "instructionSize": "2"
  },
  null,
  null,
  {
    "name": "CPY",
    "mode": "Absolute",
    "instructionSize": "3"
  },
  {
    "name": "CMP",
    "mode": "Absolute",
    "instructionSize": "3"
  },
  {
    "name": "DEC",
    "mode": "Absolute",
    "instructionSize": "3"
  },
  null,
  null,
  {
    "name": "CMP",
    "mode": "IndirectY",
    "instructionSize": "2"
  },
  null,
  null,
  null,
  {
    "name": "CMP",
    "mode": "ZeroPageX",
    "instructionSize": "2"
  },
  {
    "name": "DEC",
    "mode": "ZeroPageX",
    "instructionSize": "2"
  },
  null,
  null,
  {
    "name": "CMP",
    "mode": "AbsoluteY",
    "instructionSize": "3"
  },
  null,
  null,
  null,
  {
    "name": "CMP",
    "mode": "AbsoluteX",
    "instructionSize": "3"
  },
  {
    "name": "DEC",
    "mode": "AbsoluteX",
    "instructionSize": "3"
  },
  null,
  {
    "name": "CPX",
    "mode": "Immediate",
    "instructionSize": "2"
  },
  {
    "name": "SBC",
    "mode": "IndirectX",
    "instructionSize": "2"
  },
  null,
  null,
  {
    "name": "CPX",
    "mode": "ZeroPage",
    "instructionSize": "2"
  },
  {
    "name": "SBC",
    "mode": "ZeroPage",
    "instructionSize": "2"
  },
  {
    "name": "INC",
    "mode": "ZeroPage",
    "instructionSize": "2"
  },
  null,
  null,
  {
    "name": "SBC",
    "mode": "Immediate",
    "instructionSize": "2"
  },
  {
    "name": "NOP",
    "mode": "Implied",
    "instructionSize": "1"
  },
  null,
  {
    "name": "CPX",
    "mode": "Absolute",
    "instructionSize": "3"
  },
  {
    "name": "SBC",
    "mode": "Absolute",
    "instructionSize": "3"
  },
  {
    "name": "INC",
    "mode": "Absolute",
    "instructionSize": "3"
  },
  null,
  null,
  {
    "name": "SBC",
    "mode": "IndirectY",
    "instructionSize": "2"
  },
  null,
  null,
  null,
  {
    "name": "SBC",
    "mode": "ZeroPageX",
    "instructionSize": "2"
  },
  {
    "name": "INC",
    "mode": "ZeroPageX",
    "instructionSize": "2"
  },
  null,
  null,
  {
    "name": "SBC",
    "mode": "AbsoluteY",
    "instructionSize": "3"
  },
  null,
  null,
  null,
  {
    "name": "SBC",
    "mode": "AbsoluteX",
    "instructionSize": "3"
  },
  {
    "name": "INC",
    "mode": "AbsoluteX",
    "instructionSize": "3"
  }
];

export default opcodeMetadata;
