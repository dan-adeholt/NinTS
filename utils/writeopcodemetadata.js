const fs = require("fs")

// Taken from http://www.6502.org/tutorials/6502opcodes.html

const data=`Immediate     ADC #$44      $69  2   2
Immediate     AND #$44      $29  2   2
Immediate     CMP #$44      $C9  2   2
Immediate     CPX #$44      $E0  2   2
Immediate     CPY #$44      $C0  2   2
Immediate     EOR #$44      $49  2   2
Immediate     LDA #$44      $A9  2   2
Immediate     LDX #$44      $A2  2   2
Immediate     LDY #$44      $A0  2   2
Immediate     ORA #$44      $09  2   2
Immediate     SBC #$44      $E9  2   2

ZeroPage     ADC $44       $65  2   3
ZeroPage     AND $44       $25  2   3
ZeroPage     ASL $44       $06  2   5
ZeroPage     BIT $44       $24  2   3
ZeroPage     CMP $44       $C5  2   3
ZeroPage     CPX $44       $E4  2   3
ZeroPage     CPY $44       $C4  2   3
ZeroPage     DEC $44       $C6  2   5
ZeroPage     EOR $44       $45  2   3
ZeroPage     INC $44       $E6  2   5
ZeroPage     LDA $44       $A5  2   3
ZeroPage     LDX $44       $A6  2   3
ZeroPage     LDY $44       $A4  2   3
ZeroPage     LSR $44       $46  2   5
ZeroPage     ORA $44       $05  2   3
ZeroPage     ROL $44       $26  2   5
ZeroPage     ROR $44       $66  2   5
ZeroPage     SBC $44       $E5  2   3
ZeroPage     STA $44       $85  2   3
ZeroPage     STX $44       $86  2   3
ZeroPage     STY $44       $84  2   3


ZeroPageX   ADC $44,X     $75  2   4
ZeroPageX   AND $44,X     $35  2   4
ZeroPageX   ASL $44,X     $16  2   6
ZeroPageX   CMP $44,X     $D5  2   4
ZeroPageX   DEC $44,X     $D6  2   6
ZeroPageX   EOR $44,X     $55  2   4
ZeroPageX   INC $44,X     $F6  2   6
ZeroPageX   LDA $44,X     $B5  2   4
ZeroPageX   LDY $44,X     $B4  2   4
ZeroPageX   LSR $44,X     $56  2   6
ZeroPageX   ORA $44,X     $15  2   4
ZeroPageX   ROL $44,X     $36  2   6
ZeroPageX   ROR $44,X     $76  2   6
ZeroPageX   SBC $44,X     $F5  2   4
ZeroPageX   STA $44,X     $95  2   4
ZeroPageX   STY $44,X     $94  2   4


Absolute      ADC $4400     $6D  3   4
Absolute      AND $4400     $2D  3   4
Absolute      ASL $4400     $0E  3   6
Absolute      BIT $4400     $2C  3   4
Absolute      CMP $4400     $CD  3   4
Absolute      CPX $4400     $EC  3   4
Absolute      CPY $4400     $CC  3   4
Absolute      DEC $4400     $CE  3   6
Absolute      EOR $4400     $4D  3   4
Absolute      INC $4400     $EE  3   6
Absolute      JMP $5597     $4C  3   3
Absolute      JSR $5597     $20  3   6
Absolute      LDA $4400     $AD  3   4
Absolute      LDX $4400     $AE  3   4
Absolute      LDY $4400     $AC  3   4
Absolute      LSR $4400     $4E  3   6
Absolute      ORA $4400     $0D  3   4
Absolute      ROL $4400     $2E  3   6
Absolute      ROR $4400     $6E  3   6
Absolute      SBC $4400     $ED  3   4
Absolute      STA $4400     $8D  3   4
Absolute      STX $4400     $8E  3   4
Absolute      STY $4400     $8C  3   4

AbsoluteX    ADC $4400,X   $7D  3   4+
AbsoluteX    AND $4400,X   $3D  3   4+
AbsoluteX    ASL $4400,X   $1E  3   7
AbsoluteX    CMP $4400,X   $DD  3   4+
AbsoluteX    DEC $4400,X   $DE  3   7
AbsoluteX    EOR $4400,X   $5D  3   4+
AbsoluteX    INC $4400,X   $FE  3   7
AbsoluteX    LDA $4400,X   $BD  3   4+
AbsoluteX    LDY $4400,X   $BC  3   4+
AbsoluteX    LSR $4400,X   $5E  3   7
AbsoluteX    ORA $4400,X   $1D  3   4+
AbsoluteX    ROL $4400,X   $3E  3   7
AbsoluteX    ROR $4400,X   $7E  3   7
AbsoluteX    SBC $4400,X   $FD  3   4+
AbsoluteX    STA $4400,X   $9D  3   5


AbsoluteY    ADC $4400,Y   $79  3   4+
AbsoluteY    AND $4400,Y   $39  3   4+
AbsoluteY    CMP $4400,Y   $D9  3   4+
AbsoluteY    EOR $4400,Y   $59  3   4+
AbsoluteY    LDA $4400,Y   $B9  3   4+
AbsoluteY    LDX $4400,Y   $BE  3   4+
AbsoluteY    ORA $4400,Y   $19  3   4+
AbsoluteY    SBC $4400,Y   $F9  3   4+
AbsoluteY    STA $4400,Y   $99  3   5


IndirectX    ADC ($44,X)   $61  2   6
IndirectX    AND ($44,X)   $21  2   6
IndirectX    CMP ($44,X)   $C1  2   6
IndirectX    EOR ($44,X)   $41  2   6
IndirectX    LDA ($44,X)   $A1  2   6
IndirectX    ORA ($44,X)   $01  2   6
IndirectX    SBC ($44,X)   $E1  2   6
IndirectX    STA ($44,X)   $81  2   6

IndirectY    ADC ($44),Y   $71  2   5+
IndirectY    AND ($44),Y   $31  2   5+
IndirectY    CMP ($44),Y   $D1  2   5+
IndirectY    EOR ($44),Y   $51  2   5+
IndirectY    LDA ($44),Y   $B1  2   5+
IndirectY    ORA ($44),Y   $11  2   5+
IndirectY    SBC ($44),Y   $F1  2   5+
IndirectY    STA ($44),Y   $91  2   6

Accumulator   ASL A         $0A  1   2
Accumulator   LSR A         $4A  1   2
Accumulator   ROL A         $2A  1   2
Accumulator   ROR A         $6A  1   2

Implied       BRK           $00  1   7
Implied       NOP           $EA  1   2
Implied       RTI           $40  1   6
Implied       RTS           $60  1   6

Implied       CLC           $18  1   2
Implied       SEC           $38  1   2
Implied       CLI           $58  1   2
Implied       SEI           $78  1   2
Implied       CLV           $B8  1   2
Implied       CLD           $D8  1   2
Implied       SED           $F8  1   2

Relative      BPL           $10  2   X
Relative      BMI           $30  2   X
Relative      BVC           $50  2   X
Relative      BVS           $70  2   X
Relative      BCC           $90  2   X
Relative      BCS           $B0  2   X
Relative      BNE           $D0  2   X
Relative      BEQ           $F0  2   X

Implied       TXS           $9A  1   2
Implied       TSX           $BA  1   2
Implied       PHA           $48  1   3
Implied       PLA           $68  1   4
Implied       PHP           $08  1   3
Implied       PLP           $28  1   4
`

const lines = data.split("\n");

let opcodeData = new Array(255);

for (var line of lines) {
    const elems = line.split(" ").filter(s => s != "");
    
    if (elems.length == 0) {
        continue;
    } else if (elems.length == 5) {
        elems.splice(2, 0, '');
    }
    

    let [mode, name, example, opcode, instructionSize] = elems;

    const opcodeNum = parseInt(opcode.replace("$", ""), 16);

    opcodeData[opcodeNum] = {
        name, mode, instructionSize, opcode
    };
}

console.log();

const fileContents = "const opcodeMetadata = " + JSON.stringify(opcodeData, null, 2) + ";\n\nexport default opcodeMetadata;\n";

fs.writeFileSync("../src/emulator/opcodeMetadata.js", fileContents, "utf-8");
