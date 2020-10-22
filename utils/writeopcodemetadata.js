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

Immediate    *SBC #$44      $EB  2   2


ZeroPage     *SLO arg       $07  2   5
ZeroPageX    *SLO arg,X     $17  2   6
Absolute     *SLO arg       $0F  3   6
AbsoluteX    *SLO arg,X     $1F  3   7
AbsoluteY    *SLO arg,Y     $1B  3   7
IndirectX    *SLO (arg,X)   $03  2   8
IndirectY    *SLO (arg),Y   $13  2   8

ZeroPage     *RLA arg       $27  2   5
ZeroPageX    *RLA arg,X     $37  2   6
Absolute     *RLA arg       $2F  3   6
AbsoluteX    *RLA arg,X     $3F  3   7
AbsoluteY    *RLA arg,Y     $3B  3   7
IndirectX    *RLA (arg,X)   $23  2   8
IndirectY    *RLA (arg),Y   $33  2   8

ZeroPage     *RRA arg       $67  2   5
ZeroPageX    *RRA arg,X     $77  2   6
Absolute     *RRA arg       $6F  3   6
AbsoluteX    *RRA arg,X     $7F  3   7
AbsoluteY    *RRA arg,Y     $7B  3   7
IndirectX    *RRA (arg,X)   $63  2   8
IndirectY    *RRA (arg),Y   $73  2   8

AbsoluteY    *LAR arg,Y     $BB  3   4*

ZeroPage     *ISB arg       $E7  2   5
ZeroPageX    *ISB arg,X     $F7  2   6
Absolute     *ISB arg       $EF  3   6
AbsoluteX    *ISB arg,X     $FF  3   7
AbsoluteY    *ISB arg,Y     $FB  3   7
IndirectX    *ISB (arg,X)   $E3  2   8
IndirectY    *ISB (arg),Y   $F3  2   8


ZeroPageX    *LAX (d,X)     $A3  2   6
Absolute     *LAX abcd      $AF  3   4
AbsoluteY    *LAX abcd,Y    $BF  3   4+
ZeroPage     *LAX ab        $A7  2   3
ZeroPageY    *LAX ab,Y      $B7  2   4
IndirectX    *LAX (ab,X)    $A3  2   6
IndirectY    *LAX (ab),Y    $B3  2   5+

ZeroPage     *DCP arg       $C7  2   5
ZeroPageX    *DCP arg,X     $D7  2   6
Absolute     *DCP arg       $CF  3   6
AbsoluteX    *DCP arg,X     $DF  3   7
AbsoluteY    *DCP arg,Y     $DB  3   7
IndirectX    *DCP (arg,X)   $C3  2   8
IndirectY    *DCP (arg),Y   $D3  2   8

ZeroPage    *SAX arg        $87  2   3
ZeroPageY   *SAX arg,Y      $97  2   4
IndirectX   *SAX (arg,X)    $83  2   6
Absolute    *SAX arg        $8F  3   4


ZeroPage     *NOP $A9      $04  2   3
ZeroPage     *NOP $A9      $44  2   3
ZeroPage     *NOP $A9      $64  2   3

Absolute     *NOP $A9A9    $0C  3   4

ZeroPageX    *NOP $A9,X    $14  2   4
ZeroPageX    *NOP $A9,X    $34  2   4
ZeroPageX    *NOP $A9,X    $54  2   4
ZeroPageX    *NOP $A9,X    $74  2   4
ZeroPageX    *NOP $A9,X    $D4  2   4
ZeroPageX    *NOP $A9,X    $F4  2   4

AbsoluteX    *NOP $A9A9,X  $1C  3   5
AbsoluteX    *NOP $A9A9,X  $3C  3   5
AbsoluteX    *NOP $A9A9,X  $5C  3   5
AbsoluteX    *NOP $A9A9,X  $7C  3   5
AbsoluteX    *NOP $A9A9,X  $DC  3   5
AbsoluteX    *NOP $A9A9,X  $FC  3   5

Immediate    *NOP #$89     $80  2   2

Implied      *NOP          $1A  1   2
Implied      *NOP          $3A  1   2
Implied      *NOP          $5A  1   2
Implied      *NOP          $7A  1   2
Implied      *NOP          $DA  1   2
Implied      *NOP          $FA  1   2

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

ZeroPageY   LDX $44,Y     $B6  2   4
ZeroPageY   STX $44,Y     $96  2   4

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

Indirect     JMP ($5597)   $6C  3   5

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


Implied       TAX           $AA  1   2
Implied       TXA           $8A  1   2
Implied       DEX           $CA  1   2
Implied       INX           $E8  1   2
Implied       TAY           $A8  1   2
Implied       TYA           $98  1   2
Implied       DEY           $88  1   2
Implied       INY           $C8  1   2
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
