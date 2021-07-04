  .inesprg 1   ; 1x 16KB PRG code - NROM-128
  .ineschr 1   ; 1x  8KB CHR data
  .inesmap 0   ; mapper 0 = NROM, no bank swapping
  .inesmir 1   ; background mirroring

  .include "../util/constants.asm"

;;;;;;;;;;;;;; Set up bank 1: IRQ handlers

  .bank 1
  .org $FFFA     ;first of the three vectors starts here
  .dw NMI        ;when an NMI happens (once per frame if enabled) the
                   ;processor will jump to the label NMI:
  .dw RESET      ;when the processor first turns on or is reset, it will jump
                   ;to the label RESET:
  .dw 0          ;external interrupt IRQ is not used in this tutorial

;;;;;;;;;;;;; Set up bank 0: Reset handler, program prologue

  .bank 0
  .org $8000

RESET:
  .include "../util/init.asm"

ResetCycleColor:
  LDX #$FF

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

NMI:
  RTI
