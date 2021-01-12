  .include "../util/constants.asm"
  .include "../util/testcase.asm"

ResetCycleColor:
  LDX #$0

CycleColor:
  INX
  TXA

vblankwait:
  BIT PPU_STATUS
  BPL vblankwait


  LDA #$3f
  STA PPU_ADDR
  LDA #$00
  STA PPU_ADDR

  TXA
  STA PPU_DATA

  SBC #$3F
  BNE CycleColor

  JMP ResetCycleColor
  
