const opcodeMetadata = [
  {
    "name": "BRK",
    "mode": "Implied",
    "instructionSize": "1",
    "opcode": "$00"
  },
  {
    "name": "ORA",
    "mode": "IndirectX",
    "instructionSize": "2",
    "opcode": "$01"
  },
  null,
  null,
  null,
  {
    "name": "ORA",
    "mode": "ZeroPage",
    "instructionSize": "2",
    "opcode": "$05"
  },
  {
    "name": "ASL",
    "mode": "ZeroPage",
    "instructionSize": "2",
    "opcode": "$06"
  },
  null,
  {
    "name": "PHP",
    "mode": "Implied",
    "instructionSize": "1",
    "opcode": "$08"
  },
  {
    "name": "ORA",
    "mode": "Immediate",
    "instructionSize": "2",
    "opcode": "$09"
  },
  {
    "name": "ASL",
    "mode": "Accumulator",
    "instructionSize": "1",
    "opcode": "$0A"
  },
  null,
  null,
  {
    "name": "ORA",
    "mode": "Absolute",
    "instructionSize": "3",
    "opcode": "$0D"
  },
  {
    "name": "ASL",
    "mode": "Absolute",
    "instructionSize": "3",
    "opcode": "$0E"
  },
  null,
  {
    "name": "BPL",
    "mode": "Relative",
    "instructionSize": "2",
    "opcode": "$10"
  },
  {
    "name": "ORA",
    "mode": "IndirectY",
    "instructionSize": "2",
    "opcode": "$11"
  },
  null,
  null,
  null,
  {
    "name": "ORA",
    "mode": "ZeroPageX",
    "instructionSize": "2",
    "opcode": "$15"
  },
  {
    "name": "ASL",
    "mode": "ZeroPageX",
    "instructionSize": "2",
    "opcode": "$16"
  },
  null,
  {
    "name": "CLC",
    "mode": "Implied",
    "instructionSize": "1",
    "opcode": "$18"
  },
  {
    "name": "ORA",
    "mode": "AbsoluteY",
    "instructionSize": "3",
    "opcode": "$19"
  },
  null,
  null,
  null,
  {
    "name": "ORA",
    "mode": "AbsoluteX",
    "instructionSize": "3",
    "opcode": "$1D"
  },
  {
    "name": "ASL",
    "mode": "AbsoluteX",
    "instructionSize": "3",
    "opcode": "$1E"
  },
  null,
  {
    "name": "JSR",
    "mode": "Absolute",
    "instructionSize": "3",
    "opcode": "$20"
  },
  {
    "name": "AND",
    "mode": "IndirectX",
    "instructionSize": "2",
    "opcode": "$21"
  },
  null,
  null,
  {
    "name": "BIT",
    "mode": "ZeroPage",
    "instructionSize": "2",
    "opcode": "$24"
  },
  {
    "name": "AND",
    "mode": "ZeroPage",
    "instructionSize": "2",
    "opcode": "$25"
  },
  {
    "name": "ROL",
    "mode": "ZeroPage",
    "instructionSize": "2",
    "opcode": "$26"
  },
  null,
  {
    "name": "PLP",
    "mode": "Implied",
    "instructionSize": "1",
    "opcode": "$28"
  },
  {
    "name": "AND",
    "mode": "Immediate",
    "instructionSize": "2",
    "opcode": "$29"
  },
  {
    "name": "ROL",
    "mode": "Accumulator",
    "instructionSize": "1",
    "opcode": "$2A"
  },
  null,
  {
    "name": "BIT",
    "mode": "Absolute",
    "instructionSize": "3",
    "opcode": "$2C"
  },
  {
    "name": "AND",
    "mode": "Absolute",
    "instructionSize": "3",
    "opcode": "$2D"
  },
  {
    "name": "ROL",
    "mode": "Absolute",
    "instructionSize": "3",
    "opcode": "$2E"
  },
  null,
  {
    "name": "BMI",
    "mode": "Relative",
    "instructionSize": "2",
    "opcode": "$30"
  },
  {
    "name": "AND",
    "mode": "IndirectY",
    "instructionSize": "2",
    "opcode": "$31"
  },
  null,
  null,
  null,
  {
    "name": "AND",
    "mode": "ZeroPageX",
    "instructionSize": "2",
    "opcode": "$35"
  },
  {
    "name": "ROL",
    "mode": "ZeroPageX",
    "instructionSize": "2",
    "opcode": "$36"
  },
  null,
  {
    "name": "SEC",
    "mode": "Implied",
    "instructionSize": "1",
    "opcode": "$38"
  },
  {
    "name": "AND",
    "mode": "AbsoluteY",
    "instructionSize": "3",
    "opcode": "$39"
  },
  null,
  null,
  null,
  {
    "name": "AND",
    "mode": "AbsoluteX",
    "instructionSize": "3",
    "opcode": "$3D"
  },
  {
    "name": "ROL",
    "mode": "AbsoluteX",
    "instructionSize": "3",
    "opcode": "$3E"
  },
  null,
  {
    "name": "RTI",
    "mode": "Implied",
    "instructionSize": "1",
    "opcode": "$40"
  },
  {
    "name": "EOR",
    "mode": "IndirectX",
    "instructionSize": "2",
    "opcode": "$41"
  },
  null,
  null,
  null,
  {
    "name": "EOR",
    "mode": "ZeroPage",
    "instructionSize": "2",
    "opcode": "$45"
  },
  {
    "name": "LSR",
    "mode": "ZeroPage",
    "instructionSize": "2",
    "opcode": "$46"
  },
  null,
  {
    "name": "PHA",
    "mode": "Implied",
    "instructionSize": "1",
    "opcode": "$48"
  },
  {
    "name": "EOR",
    "mode": "Immediate",
    "instructionSize": "2",
    "opcode": "$49"
  },
  {
    "name": "LSR",
    "mode": "Accumulator",
    "instructionSize": "1",
    "opcode": "$4A"
  },
  null,
  {
    "name": "JMP",
    "mode": "Absolute",
    "instructionSize": "3",
    "opcode": "$4C"
  },
  {
    "name": "EOR",
    "mode": "Absolute",
    "instructionSize": "3",
    "opcode": "$4D"
  },
  {
    "name": "LSR",
    "mode": "Absolute",
    "instructionSize": "3",
    "opcode": "$4E"
  },
  null,
  {
    "name": "BVC",
    "mode": "Relative",
    "instructionSize": "2",
    "opcode": "$50"
  },
  {
    "name": "EOR",
    "mode": "IndirectY",
    "instructionSize": "2",
    "opcode": "$51"
  },
  null,
  null,
  null,
  {
    "name": "EOR",
    "mode": "ZeroPageX",
    "instructionSize": "2",
    "opcode": "$55"
  },
  {
    "name": "LSR",
    "mode": "ZeroPageX",
    "instructionSize": "2",
    "opcode": "$56"
  },
  null,
  {
    "name": "CLI",
    "mode": "Implied",
    "instructionSize": "1",
    "opcode": "$58"
  },
  {
    "name": "EOR",
    "mode": "AbsoluteY",
    "instructionSize": "3",
    "opcode": "$59"
  },
  null,
  null,
  null,
  {
    "name": "EOR",
    "mode": "AbsoluteX",
    "instructionSize": "3",
    "opcode": "$5D"
  },
  {
    "name": "LSR",
    "mode": "AbsoluteX",
    "instructionSize": "3",
    "opcode": "$5E"
  },
  null,
  {
    "name": "RTS",
    "mode": "Implied",
    "instructionSize": "1",
    "opcode": "$60"
  },
  {
    "name": "ADC",
    "mode": "IndirectX",
    "instructionSize": "2",
    "opcode": "$61"
  },
  null,
  null,
  null,
  {
    "name": "ADC",
    "mode": "ZeroPage",
    "instructionSize": "2",
    "opcode": "$65"
  },
  {
    "name": "ROR",
    "mode": "ZeroPage",
    "instructionSize": "2",
    "opcode": "$66"
  },
  null,
  {
    "name": "PLA",
    "mode": "Implied",
    "instructionSize": "1",
    "opcode": "$68"
  },
  {
    "name": "ADC",
    "mode": "Immediate",
    "instructionSize": "2",
    "opcode": "$69"
  },
  {
    "name": "ROR",
    "mode": "Accumulator",
    "instructionSize": "1",
    "opcode": "$6A"
  },
  null,
  null,
  {
    "name": "ADC",
    "mode": "Absolute",
    "instructionSize": "3",
    "opcode": "$6D"
  },
  {
    "name": "ROR",
    "mode": "Absolute",
    "instructionSize": "3",
    "opcode": "$6E"
  },
  null,
  {
    "name": "BVS",
    "mode": "Relative",
    "instructionSize": "2",
    "opcode": "$70"
  },
  {
    "name": "ADC",
    "mode": "IndirectY",
    "instructionSize": "2",
    "opcode": "$71"
  },
  null,
  null,
  null,
  {
    "name": "ADC",
    "mode": "ZeroPageX",
    "instructionSize": "2",
    "opcode": "$75"
  },
  {
    "name": "ROR",
    "mode": "ZeroPageX",
    "instructionSize": "2",
    "opcode": "$76"
  },
  null,
  {
    "name": "SEI",
    "mode": "Implied",
    "instructionSize": "1",
    "opcode": "$78"
  },
  {
    "name": "ADC",
    "mode": "AbsoluteY",
    "instructionSize": "3",
    "opcode": "$79"
  },
  null,
  null,
  null,
  {
    "name": "ADC",
    "mode": "AbsoluteX",
    "instructionSize": "3",
    "opcode": "$7D"
  },
  {
    "name": "ROR",
    "mode": "AbsoluteX",
    "instructionSize": "3",
    "opcode": "$7E"
  },
  null,
  null,
  {
    "name": "STA",
    "mode": "IndirectX",
    "instructionSize": "2",
    "opcode": "$81"
  },
  null,
  null,
  {
    "name": "STY",
    "mode": "ZeroPage",
    "instructionSize": "2",
    "opcode": "$84"
  },
  {
    "name": "STA",
    "mode": "ZeroPage",
    "instructionSize": "2",
    "opcode": "$85"
  },
  {
    "name": "STX",
    "mode": "ZeroPage",
    "instructionSize": "2",
    "opcode": "$86"
  },
  null,
  null,
  null,
  null,
  null,
  {
    "name": "STY",
    "mode": "Absolute",
    "instructionSize": "3",
    "opcode": "$8C"
  },
  {
    "name": "STA",
    "mode": "Absolute",
    "instructionSize": "3",
    "opcode": "$8D"
  },
  {
    "name": "STX",
    "mode": "Absolute",
    "instructionSize": "3",
    "opcode": "$8E"
  },
  null,
  {
    "name": "BCC",
    "mode": "Relative",
    "instructionSize": "2",
    "opcode": "$90"
  },
  {
    "name": "STA",
    "mode": "IndirectY",
    "instructionSize": "2",
    "opcode": "$91"
  },
  null,
  null,
  {
    "name": "STY",
    "mode": "ZeroPageX",
    "instructionSize": "2",
    "opcode": "$94"
  },
  {
    "name": "STA",
    "mode": "ZeroPageX",
    "instructionSize": "2",
    "opcode": "$95"
  },
  null,
  null,
  null,
  {
    "name": "STA",
    "mode": "AbsoluteY",
    "instructionSize": "3",
    "opcode": "$99"
  },
  {
    "name": "TXS",
    "mode": "Implied",
    "instructionSize": "1",
    "opcode": "$9A"
  },
  null,
  null,
  {
    "name": "STA",
    "mode": "AbsoluteX",
    "instructionSize": "3",
    "opcode": "$9D"
  },
  null,
  null,
  {
    "name": "LDY",
    "mode": "Immediate",
    "instructionSize": "2",
    "opcode": "$A0"
  },
  {
    "name": "LDA",
    "mode": "IndirectX",
    "instructionSize": "2",
    "opcode": "$A1"
  },
  {
    "name": "LDX",
    "mode": "Immediate",
    "instructionSize": "2",
    "opcode": "$A2"
  },
  null,
  {
    "name": "LDY",
    "mode": "ZeroPage",
    "instructionSize": "2",
    "opcode": "$A4"
  },
  {
    "name": "LDA",
    "mode": "ZeroPage",
    "instructionSize": "2",
    "opcode": "$A5"
  },
  {
    "name": "LDX",
    "mode": "ZeroPage",
    "instructionSize": "2",
    "opcode": "$A6"
  },
  null,
  null,
  {
    "name": "LDA",
    "mode": "Immediate",
    "instructionSize": "2",
    "opcode": "$A9"
  },
  null,
  null,
  {
    "name": "LDY",
    "mode": "Absolute",
    "instructionSize": "3",
    "opcode": "$AC"
  },
  {
    "name": "LDA",
    "mode": "Absolute",
    "instructionSize": "3",
    "opcode": "$AD"
  },
  {
    "name": "LDX",
    "mode": "Absolute",
    "instructionSize": "3",
    "opcode": "$AE"
  },
  null,
  {
    "name": "BCS",
    "mode": "Relative",
    "instructionSize": "2",
    "opcode": "$B0"
  },
  {
    "name": "LDA",
    "mode": "IndirectY",
    "instructionSize": "2",
    "opcode": "$B1"
  },
  null,
  null,
  {
    "name": "LDY",
    "mode": "ZeroPageX",
    "instructionSize": "2",
    "opcode": "$B4"
  },
  {
    "name": "LDA",
    "mode": "ZeroPageX",
    "instructionSize": "2",
    "opcode": "$B5"
  },
  null,
  null,
  {
    "name": "CLV",
    "mode": "Implied",
    "instructionSize": "1",
    "opcode": "$B8"
  },
  {
    "name": "LDA",
    "mode": "AbsoluteY",
    "instructionSize": "3",
    "opcode": "$B9"
  },
  {
    "name": "TSX",
    "mode": "Implied",
    "instructionSize": "1",
    "opcode": "$BA"
  },
  null,
  {
    "name": "LDY",
    "mode": "AbsoluteX",
    "instructionSize": "3",
    "opcode": "$BC"
  },
  {
    "name": "LDA",
    "mode": "AbsoluteX",
    "instructionSize": "3",
    "opcode": "$BD"
  },
  {
    "name": "LDX",
    "mode": "AbsoluteY",
    "instructionSize": "3",
    "opcode": "$BE"
  },
  null,
  {
    "name": "CPY",
    "mode": "Immediate",
    "instructionSize": "2",
    "opcode": "$C0"
  },
  {
    "name": "CMP",
    "mode": "IndirectX",
    "instructionSize": "2",
    "opcode": "$C1"
  },
  null,
  null,
  {
    "name": "CPY",
    "mode": "ZeroPage",
    "instructionSize": "2",
    "opcode": "$C4"
  },
  {
    "name": "CMP",
    "mode": "ZeroPage",
    "instructionSize": "2",
    "opcode": "$C5"
  },
  {
    "name": "DEC",
    "mode": "ZeroPage",
    "instructionSize": "2",
    "opcode": "$C6"
  },
  null,
  null,
  {
    "name": "CMP",
    "mode": "Immediate",
    "instructionSize": "2",
    "opcode": "$C9"
  },
  null,
  null,
  {
    "name": "CPY",
    "mode": "Absolute",
    "instructionSize": "3",
    "opcode": "$CC"
  },
  {
    "name": "CMP",
    "mode": "Absolute",
    "instructionSize": "3",
    "opcode": "$CD"
  },
  {
    "name": "DEC",
    "mode": "Absolute",
    "instructionSize": "3",
    "opcode": "$CE"
  },
  null,
  {
    "name": "BNE",
    "mode": "Relative",
    "instructionSize": "2",
    "opcode": "$D0"
  },
  {
    "name": "CMP",
    "mode": "IndirectY",
    "instructionSize": "2",
    "opcode": "$D1"
  },
  null,
  null,
  null,
  {
    "name": "CMP",
    "mode": "ZeroPageX",
    "instructionSize": "2",
    "opcode": "$D5"
  },
  {
    "name": "DEC",
    "mode": "ZeroPageX",
    "instructionSize": "2",
    "opcode": "$D6"
  },
  null,
  {
    "name": "CLD",
    "mode": "Implied",
    "instructionSize": "1",
    "opcode": "$D8"
  },
  {
    "name": "CMP",
    "mode": "AbsoluteY",
    "instructionSize": "3",
    "opcode": "$D9"
  },
  null,
  null,
  null,
  {
    "name": "CMP",
    "mode": "AbsoluteX",
    "instructionSize": "3",
    "opcode": "$DD"
  },
  {
    "name": "DEC",
    "mode": "AbsoluteX",
    "instructionSize": "3",
    "opcode": "$DE"
  },
  null,
  {
    "name": "CPX",
    "mode": "Immediate",
    "instructionSize": "2",
    "opcode": "$E0"
  },
  {
    "name": "SBC",
    "mode": "IndirectX",
    "instructionSize": "2",
    "opcode": "$E1"
  },
  null,
  null,
  {
    "name": "CPX",
    "mode": "ZeroPage",
    "instructionSize": "2",
    "opcode": "$E4"
  },
  {
    "name": "SBC",
    "mode": "ZeroPage",
    "instructionSize": "2",
    "opcode": "$E5"
  },
  {
    "name": "INC",
    "mode": "ZeroPage",
    "instructionSize": "2",
    "opcode": "$E6"
  },
  null,
  null,
  {
    "name": "SBC",
    "mode": "Immediate",
    "instructionSize": "2",
    "opcode": "$E9"
  },
  {
    "name": "NOP",
    "mode": "Implied",
    "instructionSize": "1",
    "opcode": "$EA"
  },
  null,
  {
    "name": "CPX",
    "mode": "Absolute",
    "instructionSize": "3",
    "opcode": "$EC"
  },
  {
    "name": "SBC",
    "mode": "Absolute",
    "instructionSize": "3",
    "opcode": "$ED"
  },
  {
    "name": "INC",
    "mode": "Absolute",
    "instructionSize": "3",
    "opcode": "$EE"
  },
  null,
  {
    "name": "BEQ",
    "mode": "Relative",
    "instructionSize": "2",
    "opcode": "$F0"
  },
  {
    "name": "SBC",
    "mode": "IndirectY",
    "instructionSize": "2",
    "opcode": "$F1"
  },
  null,
  null,
  null,
  {
    "name": "SBC",
    "mode": "ZeroPageX",
    "instructionSize": "2",
    "opcode": "$F5"
  },
  {
    "name": "INC",
    "mode": "ZeroPageX",
    "instructionSize": "2",
    "opcode": "$F6"
  },
  null,
  {
    "name": "SED",
    "mode": "Implied",
    "instructionSize": "1",
    "opcode": "$F8"
  },
  {
    "name": "SBC",
    "mode": "AbsoluteY",
    "instructionSize": "3",
    "opcode": "$F9"
  },
  null,
  null,
  null,
  {
    "name": "SBC",
    "mode": "AbsoluteX",
    "instructionSize": "3",
    "opcode": "$FD"
  },
  {
    "name": "INC",
    "mode": "AbsoluteX",
    "instructionSize": "3",
    "opcode": "$FE"
  }
];

export default opcodeMetadata;
