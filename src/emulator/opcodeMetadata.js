const opcodeMetadata = [
  {
    "name": "BRK",
    "mode": "Implied",
    "instructionSize": 1,
    "opcode": "$00"
  },
  {
    "name": "ORA",
    "mode": "IndirectX",
    "instructionSize": 2,
    "opcode": "$01"
  },
  null,
  {
    "name": "*SLO",
    "mode": "IndirectX",
    "instructionSize": 2,
    "opcode": "$03"
  },
  {
    "name": "*NOP",
    "mode": "ZeroPage",
    "instructionSize": 2,
    "opcode": "$04"
  },
  {
    "name": "ORA",
    "mode": "ZeroPage",
    "instructionSize": 2,
    "opcode": "$05"
  },
  {
    "name": "ASL",
    "mode": "ZeroPage",
    "instructionSize": 2,
    "opcode": "$06"
  },
  {
    "name": "*SLO",
    "mode": "ZeroPage",
    "instructionSize": 2,
    "opcode": "$07"
  },
  {
    "name": "PHP",
    "mode": "Implied",
    "instructionSize": 1,
    "opcode": "$08"
  },
  {
    "name": "ORA",
    "mode": "Immediate",
    "instructionSize": 2,
    "opcode": "$09"
  },
  {
    "name": "ASL",
    "mode": "Accumulator",
    "instructionSize": 1,
    "opcode": "$0A"
  },
  {
    "name": "*AAC",
    "mode": "Immediate",
    "instructionSize": 2,
    "opcode": "$0B"
  },
  {
    "name": "*NOP",
    "mode": "Absolute",
    "instructionSize": 3,
    "opcode": "$0C"
  },
  {
    "name": "ORA",
    "mode": "Absolute",
    "instructionSize": 3,
    "opcode": "$0D"
  },
  {
    "name": "ASL",
    "mode": "Absolute",
    "instructionSize": 3,
    "opcode": "$0E"
  },
  {
    "name": "*SLO",
    "mode": "Absolute",
    "instructionSize": 3,
    "opcode": "$0F"
  },
  {
    "name": "BPL",
    "mode": "Relative",
    "instructionSize": 2,
    "opcode": "$10"
  },
  {
    "name": "ORA",
    "mode": "IndirectY",
    "instructionSize": 2,
    "opcode": "$11"
  },
  null,
  {
    "name": "*SLO",
    "mode": "IndirectY",
    "instructionSize": 2,
    "opcode": "$13"
  },
  {
    "name": "*NOP",
    "mode": "ZeroPageX",
    "instructionSize": 2,
    "opcode": "$14"
  },
  {
    "name": "ORA",
    "mode": "ZeroPageX",
    "instructionSize": 2,
    "opcode": "$15"
  },
  {
    "name": "ASL",
    "mode": "ZeroPageX",
    "instructionSize": 2,
    "opcode": "$16"
  },
  {
    "name": "*SLO",
    "mode": "ZeroPageX",
    "instructionSize": 2,
    "opcode": "$17"
  },
  {
    "name": "CLC",
    "mode": "Implied",
    "instructionSize": 1,
    "opcode": "$18"
  },
  {
    "name": "ORA",
    "mode": "AbsoluteY",
    "instructionSize": 3,
    "opcode": "$19"
  },
  {
    "name": "*NOP",
    "mode": "Implied",
    "instructionSize": 1,
    "opcode": "$1A"
  },
  {
    "name": "*SLO",
    "mode": "AbsoluteY",
    "instructionSize": 3,
    "opcode": "$1B"
  },
  {
    "name": "*NOP",
    "mode": "AbsoluteX",
    "instructionSize": 3,
    "opcode": "$1C"
  },
  {
    "name": "ORA",
    "mode": "AbsoluteX",
    "instructionSize": 3,
    "opcode": "$1D"
  },
  {
    "name": "ASL",
    "mode": "AbsoluteX",
    "instructionSize": 3,
    "opcode": "$1E"
  },
  {
    "name": "*SLO",
    "mode": "AbsoluteX",
    "instructionSize": 3,
    "opcode": "$1F"
  },
  {
    "name": "JSR",
    "mode": "Absolute",
    "instructionSize": 3,
    "opcode": "$20"
  },
  {
    "name": "AND",
    "mode": "IndirectX",
    "instructionSize": 2,
    "opcode": "$21"
  },
  null,
  {
    "name": "*RLA",
    "mode": "IndirectX",
    "instructionSize": 2,
    "opcode": "$23"
  },
  {
    "name": "BIT",
    "mode": "ZeroPage",
    "instructionSize": 2,
    "opcode": "$24"
  },
  {
    "name": "AND",
    "mode": "ZeroPage",
    "instructionSize": 2,
    "opcode": "$25"
  },
  {
    "name": "ROL",
    "mode": "ZeroPage",
    "instructionSize": 2,
    "opcode": "$26"
  },
  {
    "name": "*RLA",
    "mode": "ZeroPage",
    "instructionSize": 2,
    "opcode": "$27"
  },
  {
    "name": "PLP",
    "mode": "Implied",
    "instructionSize": 1,
    "opcode": "$28"
  },
  {
    "name": "AND",
    "mode": "Immediate",
    "instructionSize": 2,
    "opcode": "$29"
  },
  {
    "name": "ROL",
    "mode": "Accumulator",
    "instructionSize": 1,
    "opcode": "$2A"
  },
  {
    "name": "*AAC",
    "mode": "Immediate",
    "instructionSize": 2,
    "opcode": "$2B"
  },
  {
    "name": "BIT",
    "mode": "Absolute",
    "instructionSize": 3,
    "opcode": "$2C"
  },
  {
    "name": "AND",
    "mode": "Absolute",
    "instructionSize": 3,
    "opcode": "$2D"
  },
  {
    "name": "ROL",
    "mode": "Absolute",
    "instructionSize": 3,
    "opcode": "$2E"
  },
  {
    "name": "*RLA",
    "mode": "Absolute",
    "instructionSize": 3,
    "opcode": "$2F"
  },
  {
    "name": "BMI",
    "mode": "Relative",
    "instructionSize": 2,
    "opcode": "$30"
  },
  {
    "name": "AND",
    "mode": "IndirectY",
    "instructionSize": 2,
    "opcode": "$31"
  },
  null,
  {
    "name": "*RLA",
    "mode": "IndirectY",
    "instructionSize": 2,
    "opcode": "$33"
  },
  {
    "name": "*NOP",
    "mode": "ZeroPageX",
    "instructionSize": 2,
    "opcode": "$34"
  },
  {
    "name": "AND",
    "mode": "ZeroPageX",
    "instructionSize": 2,
    "opcode": "$35"
  },
  {
    "name": "ROL",
    "mode": "ZeroPageX",
    "instructionSize": 2,
    "opcode": "$36"
  },
  {
    "name": "*RLA",
    "mode": "ZeroPageX",
    "instructionSize": 2,
    "opcode": "$37"
  },
  {
    "name": "SEC",
    "mode": "Implied",
    "instructionSize": 1,
    "opcode": "$38"
  },
  {
    "name": "AND",
    "mode": "AbsoluteY",
    "instructionSize": 3,
    "opcode": "$39"
  },
  {
    "name": "*NOP",
    "mode": "Implied",
    "instructionSize": 1,
    "opcode": "$3A"
  },
  {
    "name": "*RLA",
    "mode": "AbsoluteY",
    "instructionSize": 3,
    "opcode": "$3B"
  },
  {
    "name": "*NOP",
    "mode": "AbsoluteX",
    "instructionSize": 3,
    "opcode": "$3C"
  },
  {
    "name": "AND",
    "mode": "AbsoluteX",
    "instructionSize": 3,
    "opcode": "$3D"
  },
  {
    "name": "ROL",
    "mode": "AbsoluteX",
    "instructionSize": 3,
    "opcode": "$3E"
  },
  {
    "name": "*RLA",
    "mode": "AbsoluteX",
    "instructionSize": 3,
    "opcode": "$3F"
  },
  {
    "name": "RTI",
    "mode": "Implied",
    "instructionSize": 1,
    "opcode": "$40"
  },
  {
    "name": "EOR",
    "mode": "IndirectX",
    "instructionSize": 2,
    "opcode": "$41"
  },
  null,
  {
    "name": "*SRE",
    "mode": "IndirectX",
    "instructionSize": 2,
    "opcode": "$43"
  },
  {
    "name": "*NOP",
    "mode": "ZeroPage",
    "instructionSize": 2,
    "opcode": "$44"
  },
  {
    "name": "EOR",
    "mode": "ZeroPage",
    "instructionSize": 2,
    "opcode": "$45"
  },
  {
    "name": "LSR",
    "mode": "ZeroPage",
    "instructionSize": 2,
    "opcode": "$46"
  },
  {
    "name": "*SRE",
    "mode": "ZeroPage",
    "instructionSize": 2,
    "opcode": "$47"
  },
  {
    "name": "PHA",
    "mode": "Implied",
    "instructionSize": 1,
    "opcode": "$48"
  },
  {
    "name": "EOR",
    "mode": "Immediate",
    "instructionSize": 2,
    "opcode": "$49"
  },
  {
    "name": "LSR",
    "mode": "Accumulator",
    "instructionSize": 1,
    "opcode": "$4A"
  },
  {
    "name": "*ASR",
    "mode": "Immediate",
    "instructionSize": 2,
    "opcode": "$4B"
  },
  {
    "name": "JMP",
    "mode": "Absolute",
    "instructionSize": 3,
    "opcode": "$4C"
  },
  {
    "name": "EOR",
    "mode": "Absolute",
    "instructionSize": 3,
    "opcode": "$4D"
  },
  {
    "name": "LSR",
    "mode": "Absolute",
    "instructionSize": 3,
    "opcode": "$4E"
  },
  {
    "name": "*SRE",
    "mode": "Absolute",
    "instructionSize": 3,
    "opcode": "$4F"
  },
  {
    "name": "BVC",
    "mode": "Relative",
    "instructionSize": 2,
    "opcode": "$50"
  },
  {
    "name": "EOR",
    "mode": "IndirectY",
    "instructionSize": 2,
    "opcode": "$51"
  },
  null,
  {
    "name": "*SRE",
    "mode": "IndirectY",
    "instructionSize": 2,
    "opcode": "$53"
  },
  {
    "name": "*NOP",
    "mode": "ZeroPageX",
    "instructionSize": 2,
    "opcode": "$54"
  },
  {
    "name": "EOR",
    "mode": "ZeroPageX",
    "instructionSize": 2,
    "opcode": "$55"
  },
  {
    "name": "LSR",
    "mode": "ZeroPageX",
    "instructionSize": 2,
    "opcode": "$56"
  },
  {
    "name": "*SRE",
    "mode": "ZeroPageX",
    "instructionSize": 2,
    "opcode": "$57"
  },
  {
    "name": "CLI",
    "mode": "Implied",
    "instructionSize": 1,
    "opcode": "$58"
  },
  {
    "name": "EOR",
    "mode": "AbsoluteY",
    "instructionSize": 3,
    "opcode": "$59"
  },
  {
    "name": "*NOP",
    "mode": "Implied",
    "instructionSize": 1,
    "opcode": "$5A"
  },
  {
    "name": "*SRE",
    "mode": "AbsoluteY",
    "instructionSize": 3,
    "opcode": "$5B"
  },
  {
    "name": "*NOP",
    "mode": "AbsoluteX",
    "instructionSize": 3,
    "opcode": "$5C"
  },
  {
    "name": "EOR",
    "mode": "AbsoluteX",
    "instructionSize": 3,
    "opcode": "$5D"
  },
  {
    "name": "LSR",
    "mode": "AbsoluteX",
    "instructionSize": 3,
    "opcode": "$5E"
  },
  {
    "name": "*SRE",
    "mode": "AbsoluteX",
    "instructionSize": 3,
    "opcode": "$5F"
  },
  {
    "name": "RTS",
    "mode": "Implied",
    "instructionSize": 1,
    "opcode": "$60"
  },
  {
    "name": "ADC",
    "mode": "IndirectX",
    "instructionSize": 2,
    "opcode": "$61"
  },
  null,
  {
    "name": "*RRA",
    "mode": "IndirectX",
    "instructionSize": 2,
    "opcode": "$63"
  },
  {
    "name": "*NOP",
    "mode": "ZeroPage",
    "instructionSize": 2,
    "opcode": "$64"
  },
  {
    "name": "ADC",
    "mode": "ZeroPage",
    "instructionSize": 2,
    "opcode": "$65"
  },
  {
    "name": "ROR",
    "mode": "ZeroPage",
    "instructionSize": 2,
    "opcode": "$66"
  },
  {
    "name": "*RRA",
    "mode": "ZeroPage",
    "instructionSize": 2,
    "opcode": "$67"
  },
  {
    "name": "PLA",
    "mode": "Implied",
    "instructionSize": 1,
    "opcode": "$68"
  },
  {
    "name": "ADC",
    "mode": "Immediate",
    "instructionSize": 2,
    "opcode": "$69"
  },
  {
    "name": "ROR",
    "mode": "Accumulator",
    "instructionSize": 1,
    "opcode": "$6A"
  },
  {
    "name": "*ARR",
    "mode": "Immediate",
    "instructionSize": 2,
    "opcode": "$6B"
  },
  {
    "name": "JMP",
    "mode": "Indirect",
    "instructionSize": 3,
    "opcode": "$6C"
  },
  {
    "name": "ADC",
    "mode": "Absolute",
    "instructionSize": 3,
    "opcode": "$6D"
  },
  {
    "name": "ROR",
    "mode": "Absolute",
    "instructionSize": 3,
    "opcode": "$6E"
  },
  {
    "name": "*RRA",
    "mode": "Absolute",
    "instructionSize": 3,
    "opcode": "$6F"
  },
  {
    "name": "BVS",
    "mode": "Relative",
    "instructionSize": 2,
    "opcode": "$70"
  },
  {
    "name": "ADC",
    "mode": "IndirectY",
    "instructionSize": 2,
    "opcode": "$71"
  },
  null,
  {
    "name": "*RRA",
    "mode": "IndirectY",
    "instructionSize": 2,
    "opcode": "$73"
  },
  {
    "name": "*NOP",
    "mode": "ZeroPageX",
    "instructionSize": 2,
    "opcode": "$74"
  },
  {
    "name": "ADC",
    "mode": "ZeroPageX",
    "instructionSize": 2,
    "opcode": "$75"
  },
  {
    "name": "ROR",
    "mode": "ZeroPageX",
    "instructionSize": 2,
    "opcode": "$76"
  },
  {
    "name": "*RRA",
    "mode": "ZeroPageX",
    "instructionSize": 2,
    "opcode": "$77"
  },
  {
    "name": "SEI",
    "mode": "Implied",
    "instructionSize": 1,
    "opcode": "$78"
  },
  {
    "name": "ADC",
    "mode": "AbsoluteY",
    "instructionSize": 3,
    "opcode": "$79"
  },
  {
    "name": "*NOP",
    "mode": "Implied",
    "instructionSize": 1,
    "opcode": "$7A"
  },
  {
    "name": "*RRA",
    "mode": "AbsoluteY",
    "instructionSize": 3,
    "opcode": "$7B"
  },
  {
    "name": "*NOP",
    "mode": "AbsoluteX",
    "instructionSize": 3,
    "opcode": "$7C"
  },
  {
    "name": "ADC",
    "mode": "AbsoluteX",
    "instructionSize": 3,
    "opcode": "$7D"
  },
  {
    "name": "ROR",
    "mode": "AbsoluteX",
    "instructionSize": 3,
    "opcode": "$7E"
  },
  {
    "name": "*RRA",
    "mode": "AbsoluteX",
    "instructionSize": 3,
    "opcode": "$7F"
  },
  {
    "name": "*NOP",
    "mode": "Immediate",
    "instructionSize": 2,
    "opcode": "$80"
  },
  {
    "name": "STA",
    "mode": "IndirectX",
    "instructionSize": 2,
    "opcode": "$81"
  },
  {
    "name": "*DOP",
    "mode": "Immediate",
    "instructionSize": 2,
    "opcode": "$82"
  },
  {
    "name": "*SAX",
    "mode": "IndirectX",
    "instructionSize": 2,
    "opcode": "$83"
  },
  {
    "name": "STY",
    "mode": "ZeroPage",
    "instructionSize": 2,
    "opcode": "$84"
  },
  {
    "name": "STA",
    "mode": "ZeroPage",
    "instructionSize": 2,
    "opcode": "$85"
  },
  {
    "name": "STX",
    "mode": "ZeroPage",
    "instructionSize": 2,
    "opcode": "$86"
  },
  {
    "name": "*SAX",
    "mode": "ZeroPage",
    "instructionSize": 2,
    "opcode": "$87"
  },
  {
    "name": "DEY",
    "mode": "Implied",
    "instructionSize": 1,
    "opcode": "$88"
  },
  {
    "name": "*DOP",
    "mode": "Immediate",
    "instructionSize": 2,
    "opcode": "$89"
  },
  {
    "name": "TXA",
    "mode": "Implied",
    "instructionSize": 1,
    "opcode": "$8A"
  },
  {
    "name": "*XAA",
    "mode": "Immediate",
    "instructionSize": 2,
    "opcode": "$8B"
  },
  {
    "name": "STY",
    "mode": "Absolute",
    "instructionSize": 3,
    "opcode": "$8C"
  },
  {
    "name": "STA",
    "mode": "Absolute",
    "instructionSize": 3,
    "opcode": "$8D"
  },
  {
    "name": "STX",
    "mode": "Absolute",
    "instructionSize": 3,
    "opcode": "$8E"
  },
  {
    "name": "*SAX",
    "mode": "Absolute",
    "instructionSize": 3,
    "opcode": "$8F"
  },
  {
    "name": "BCC",
    "mode": "Relative",
    "instructionSize": 2,
    "opcode": "$90"
  },
  {
    "name": "STA",
    "mode": "IndirectY",
    "instructionSize": 2,
    "opcode": "$91"
  },
  null,
  {
    "name": "*AXA",
    "mode": "IndirectY",
    "instructionSize": 2,
    "opcode": "$93"
  },
  {
    "name": "STY",
    "mode": "ZeroPageX",
    "instructionSize": 2,
    "opcode": "$94"
  },
  {
    "name": "STA",
    "mode": "ZeroPageX",
    "instructionSize": 2,
    "opcode": "$95"
  },
  {
    "name": "STX",
    "mode": "ZeroPageY",
    "instructionSize": 2,
    "opcode": "$96"
  },
  {
    "name": "*SAX",
    "mode": "ZeroPageY",
    "instructionSize": 2,
    "opcode": "$97"
  },
  {
    "name": "TYA",
    "mode": "Implied",
    "instructionSize": 1,
    "opcode": "$98"
  },
  {
    "name": "STA",
    "mode": "AbsoluteY",
    "instructionSize": 3,
    "opcode": "$99"
  },
  {
    "name": "TXS",
    "mode": "Implied",
    "instructionSize": 1,
    "opcode": "$9A"
  },
  {
    "name": "*XAS",
    "mode": "AbsoluteY",
    "instructionSize": 3,
    "opcode": "$9B"
  },
  {
    "name": "*SYA",
    "mode": "AbsoluteX",
    "instructionSize": 3,
    "opcode": "$9C"
  },
  {
    "name": "STA",
    "mode": "AbsoluteX",
    "instructionSize": 3,
    "opcode": "$9D"
  },
  {
    "name": "*SXA",
    "mode": "AbsoluteY",
    "instructionSize": 3,
    "opcode": "$9E"
  },
  {
    "name": "*AXA",
    "mode": "AbsoluteY",
    "instructionSize": 3,
    "opcode": "$9F"
  },
  {
    "name": "LDY",
    "mode": "Immediate",
    "instructionSize": 2,
    "opcode": "$A0"
  },
  {
    "name": "LDA",
    "mode": "IndirectX",
    "instructionSize": 2,
    "opcode": "$A1"
  },
  {
    "name": "LDX",
    "mode": "Immediate",
    "instructionSize": 2,
    "opcode": "$A2"
  },
  {
    "name": "*LAX",
    "mode": "IndirectX",
    "instructionSize": 2,
    "opcode": "$A3"
  },
  {
    "name": "LDY",
    "mode": "ZeroPage",
    "instructionSize": 2,
    "opcode": "$A4"
  },
  {
    "name": "LDA",
    "mode": "ZeroPage",
    "instructionSize": 2,
    "opcode": "$A5"
  },
  {
    "name": "LDX",
    "mode": "ZeroPage",
    "instructionSize": 2,
    "opcode": "$A6"
  },
  {
    "name": "*LAX",
    "mode": "ZeroPage",
    "instructionSize": 2,
    "opcode": "$A7"
  },
  {
    "name": "TAY",
    "mode": "Implied",
    "instructionSize": 1,
    "opcode": "$A8"
  },
  {
    "name": "LDA",
    "mode": "Immediate",
    "instructionSize": 2,
    "opcode": "$A9"
  },
  {
    "name": "TAX",
    "mode": "Implied",
    "instructionSize": 1,
    "opcode": "$AA"
  },
  {
    "name": "*ATX",
    "mode": "Immediate",
    "instructionSize": 2,
    "opcode": "$AB"
  },
  {
    "name": "LDY",
    "mode": "Absolute",
    "instructionSize": 3,
    "opcode": "$AC"
  },
  {
    "name": "LDA",
    "mode": "Absolute",
    "instructionSize": 3,
    "opcode": "$AD"
  },
  {
    "name": "LDX",
    "mode": "Absolute",
    "instructionSize": 3,
    "opcode": "$AE"
  },
  {
    "name": "*LAX",
    "mode": "Absolute",
    "instructionSize": 3,
    "opcode": "$AF"
  },
  {
    "name": "BCS",
    "mode": "Relative",
    "instructionSize": 2,
    "opcode": "$B0"
  },
  {
    "name": "LDA",
    "mode": "IndirectY",
    "instructionSize": 2,
    "opcode": "$B1"
  },
  null,
  {
    "name": "*LAX",
    "mode": "IndirectY",
    "instructionSize": 2,
    "opcode": "$B3"
  },
  {
    "name": "LDY",
    "mode": "ZeroPageX",
    "instructionSize": 2,
    "opcode": "$B4"
  },
  {
    "name": "LDA",
    "mode": "ZeroPageX",
    "instructionSize": 2,
    "opcode": "$B5"
  },
  {
    "name": "LDX",
    "mode": "ZeroPageY",
    "instructionSize": 2,
    "opcode": "$B6"
  },
  {
    "name": "*LAX",
    "mode": "ZeroPageY",
    "instructionSize": 2,
    "opcode": "$B7"
  },
  {
    "name": "CLV",
    "mode": "Implied",
    "instructionSize": 1,
    "opcode": "$B8"
  },
  {
    "name": "LDA",
    "mode": "AbsoluteY",
    "instructionSize": 3,
    "opcode": "$B9"
  },
  {
    "name": "TSX",
    "mode": "Implied",
    "instructionSize": 1,
    "opcode": "$BA"
  },
  {
    "name": "*LAR",
    "mode": "Absolute,Y",
    "instructionSize": 3,
    "opcode": "$BB"
  },
  {
    "name": "LDY",
    "mode": "AbsoluteX",
    "instructionSize": 3,
    "opcode": "$BC"
  },
  {
    "name": "LDA",
    "mode": "AbsoluteX",
    "instructionSize": 3,
    "opcode": "$BD"
  },
  {
    "name": "LDX",
    "mode": "AbsoluteY",
    "instructionSize": 3,
    "opcode": "$BE"
  },
  {
    "name": "*LAX",
    "mode": "AbsoluteY",
    "instructionSize": 3,
    "opcode": "$BF"
  },
  {
    "name": "CPY",
    "mode": "Immediate",
    "instructionSize": 2,
    "opcode": "$C0"
  },
  {
    "name": "CMP",
    "mode": "IndirectX",
    "instructionSize": 2,
    "opcode": "$C1"
  },
  {
    "name": "*DOP",
    "mode": "Immediate",
    "instructionSize": 2,
    "opcode": "$C2"
  },
  {
    "name": "*DCP",
    "mode": "IndirectX",
    "instructionSize": 2,
    "opcode": "$C3"
  },
  {
    "name": "CPY",
    "mode": "ZeroPage",
    "instructionSize": 2,
    "opcode": "$C4"
  },
  {
    "name": "CMP",
    "mode": "ZeroPage",
    "instructionSize": 2,
    "opcode": "$C5"
  },
  {
    "name": "DEC",
    "mode": "ZeroPage",
    "instructionSize": 2,
    "opcode": "$C6"
  },
  {
    "name": "*DCP",
    "mode": "ZeroPage",
    "instructionSize": 2,
    "opcode": "$C7"
  },
  {
    "name": "INY",
    "mode": "Implied",
    "instructionSize": 1,
    "opcode": "$C8"
  },
  {
    "name": "CMP",
    "mode": "Immediate",
    "instructionSize": 2,
    "opcode": "$C9"
  },
  {
    "name": "DEX",
    "mode": "Implied",
    "instructionSize": 1,
    "opcode": "$CA"
  },
  {
    "name": "*AXS",
    "mode": "Immediate",
    "instructionSize": 2,
    "opcode": "$CB"
  },
  {
    "name": "CPY",
    "mode": "Absolute",
    "instructionSize": 3,
    "opcode": "$CC"
  },
  {
    "name": "CMP",
    "mode": "Absolute",
    "instructionSize": 3,
    "opcode": "$CD"
  },
  {
    "name": "DEC",
    "mode": "Absolute",
    "instructionSize": 3,
    "opcode": "$CE"
  },
  {
    "name": "*DCP",
    "mode": "Absolute",
    "instructionSize": 3,
    "opcode": "$CF"
  },
  {
    "name": "BNE",
    "mode": "Relative",
    "instructionSize": 2,
    "opcode": "$D0"
  },
  {
    "name": "CMP",
    "mode": "IndirectY",
    "instructionSize": 2,
    "opcode": "$D1"
  },
  null,
  {
    "name": "*DCP",
    "mode": "IndirectY",
    "instructionSize": 2,
    "opcode": "$D3"
  },
  {
    "name": "*NOP",
    "mode": "ZeroPageX",
    "instructionSize": 2,
    "opcode": "$D4"
  },
  {
    "name": "CMP",
    "mode": "ZeroPageX",
    "instructionSize": 2,
    "opcode": "$D5"
  },
  {
    "name": "DEC",
    "mode": "ZeroPageX",
    "instructionSize": 2,
    "opcode": "$D6"
  },
  {
    "name": "*DCP",
    "mode": "ZeroPageX",
    "instructionSize": 2,
    "opcode": "$D7"
  },
  {
    "name": "CLD",
    "mode": "Implied",
    "instructionSize": 1,
    "opcode": "$D8"
  },
  {
    "name": "CMP",
    "mode": "AbsoluteY",
    "instructionSize": 3,
    "opcode": "$D9"
  },
  {
    "name": "*NOP",
    "mode": "Implied",
    "instructionSize": 1,
    "opcode": "$DA"
  },
  {
    "name": "*DCP",
    "mode": "AbsoluteY",
    "instructionSize": 3,
    "opcode": "$DB"
  },
  {
    "name": "*NOP",
    "mode": "AbsoluteX",
    "instructionSize": 3,
    "opcode": "$DC"
  },
  {
    "name": "CMP",
    "mode": "AbsoluteX",
    "instructionSize": 3,
    "opcode": "$DD"
  },
  {
    "name": "DEC",
    "mode": "AbsoluteX",
    "instructionSize": 3,
    "opcode": "$DE"
  },
  {
    "name": "*DCP",
    "mode": "AbsoluteX",
    "instructionSize": 3,
    "opcode": "$DF"
  },
  {
    "name": "CPX",
    "mode": "Immediate",
    "instructionSize": 2,
    "opcode": "$E0"
  },
  {
    "name": "SBC",
    "mode": "IndirectX",
    "instructionSize": 2,
    "opcode": "$E1"
  },
  {
    "name": "*DOP",
    "mode": "Immediate",
    "instructionSize": 2,
    "opcode": "$E2"
  },
  {
    "name": "*ISB",
    "mode": "IndirectX",
    "instructionSize": 2,
    "opcode": "$E3"
  },
  {
    "name": "CPX",
    "mode": "ZeroPage",
    "instructionSize": 2,
    "opcode": "$E4"
  },
  {
    "name": "SBC",
    "mode": "ZeroPage",
    "instructionSize": 2,
    "opcode": "$E5"
  },
  {
    "name": "INC",
    "mode": "ZeroPage",
    "instructionSize": 2,
    "opcode": "$E6"
  },
  {
    "name": "*ISB",
    "mode": "ZeroPage",
    "instructionSize": 2,
    "opcode": "$E7"
  },
  {
    "name": "INX",
    "mode": "Implied",
    "instructionSize": 1,
    "opcode": "$E8"
  },
  {
    "name": "SBC",
    "mode": "Immediate",
    "instructionSize": 2,
    "opcode": "$E9"
  },
  {
    "name": "NOP",
    "mode": "Implied",
    "instructionSize": 1,
    "opcode": "$EA"
  },
  {
    "name": "*SBC",
    "mode": "Immediate",
    "instructionSize": 2,
    "opcode": "$EB"
  },
  {
    "name": "CPX",
    "mode": "Absolute",
    "instructionSize": 3,
    "opcode": "$EC"
  },
  {
    "name": "SBC",
    "mode": "Absolute",
    "instructionSize": 3,
    "opcode": "$ED"
  },
  {
    "name": "INC",
    "mode": "Absolute",
    "instructionSize": 3,
    "opcode": "$EE"
  },
  {
    "name": "*ISB",
    "mode": "Absolute",
    "instructionSize": 3,
    "opcode": "$EF"
  },
  {
    "name": "BEQ",
    "mode": "Relative",
    "instructionSize": 2,
    "opcode": "$F0"
  },
  {
    "name": "SBC",
    "mode": "IndirectY",
    "instructionSize": 2,
    "opcode": "$F1"
  },
  null,
  {
    "name": "*ISB",
    "mode": "IndirectY",
    "instructionSize": 2,
    "opcode": "$F3"
  },
  {
    "name": "*NOP",
    "mode": "ZeroPageX",
    "instructionSize": 2,
    "opcode": "$F4"
  },
  {
    "name": "SBC",
    "mode": "ZeroPageX",
    "instructionSize": 2,
    "opcode": "$F5"
  },
  {
    "name": "INC",
    "mode": "ZeroPageX",
    "instructionSize": 2,
    "opcode": "$F6"
  },
  {
    "name": "*ISB",
    "mode": "ZeroPageX",
    "instructionSize": 2,
    "opcode": "$F7"
  },
  {
    "name": "SED",
    "mode": "Implied",
    "instructionSize": 1,
    "opcode": "$F8"
  },
  {
    "name": "SBC",
    "mode": "AbsoluteY",
    "instructionSize": 3,
    "opcode": "$F9"
  },
  {
    "name": "*NOP",
    "mode": "Implied",
    "instructionSize": 1,
    "opcode": "$FA"
  },
  {
    "name": "*ISB",
    "mode": "AbsoluteY",
    "instructionSize": 3,
    "opcode": "$FB"
  },
  {
    "name": "*NOP",
    "mode": "AbsoluteX",
    "instructionSize": 3,
    "opcode": "$FC"
  },
  {
    "name": "SBC",
    "mode": "AbsoluteX",
    "instructionSize": 3,
    "opcode": "$FD"
  },
  {
    "name": "INC",
    "mode": "AbsoluteX",
    "instructionSize": 3,
    "opcode": "$FE"
  },
  {
    "name": "*ISB",
    "mode": "AbsoluteX",
    "instructionSize": 3,
    "opcode": "$FF"
  }
];

export default opcodeMetadata;
