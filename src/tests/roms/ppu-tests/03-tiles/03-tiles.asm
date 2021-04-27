  .include "../util/constants.asm"

  .inesprg 2   ; 2x 16KB PRG code - NROM-256
  .ineschr 1   ; 1x  8KB CHR data
  .inesmap 0   ; mapper 0 = NROM, no bank swapping
  .inesmir 1   ; background mirroring

;;;;;;;;;;;;;; Set up bank 3: IRQ handlers

  .bank 3
  .org $FFFA     ;first of the three vectors starts here
  .dw NMI        ;when an NMI happens (once per frame if enabled) the
                   ;processor will jump to the label NMI:
  .dw RESET      ;when the processor first turns on or is reset, it will jump
                   ;to the label RESET:
  .dw 0          ;external interrupt IRQ is not used in this tutorial


;;;;;;;;;;;;;; Set up bank 4: Graphics

  .bank 4
  .org $0000
  .incbin "../util/tiles.chr"

;;;;;;;;;;;;;; Set up bank 1: Palettes
  .bank 1
  .org $A000
;;; Palette definitions. Note that some of these will be mirror written - 3F00/3F10 is universal
;;; background color and has to be written twice to work properly (only second write matters)
palette:
  .db COLOR_BLACK            ;; Background color
  .db COLOR_BLUE,COLOR_BLUE,COLOR_BLUE,$0F ;; BG palette 0
  .db COLOR_BLUE,COLOR_BLUE,COLOR_RED,$0F        ;; BG palette 1
  .db COLOR_BLUE,COLOR_BLUE,COLOR_GREEN,$0F        ;; BG palette 2
  .db COLOR_BLUE,COLOR_BLUE,COLOR_WHITE            ;; BG palette 3
  .db COLOR_BLACK            ;; Background color, again
  .db $1C,$15,COLOR_BLUE,$0F ;; Sprite palette 0
  .db $1C,$15,COLOR_RED,$0F ;; Sprite palette 1
  .db $1C,$15,COLOR_GREEN,$0F ;; Sprite palette 1
  .db $1C,$15,COLOR_WHITE,$0F ;; Sprite palette 3

;;;;;;;;;;;;;; Set up bank 1: OAM Layouts
  .bank 2
  .org $C000
tiles:
  .incbin "tiles.bin"

;;;;;;;;;;;;; Set up bank 0: Reset handler, program prologue

  .bank 0
  .org $8000

RESET:
  .include "../util/init.asm"


LoadPalettes:
  LDA PPU_STATUS    ; read PPU status to reset the high/low latch
  LDA #$3F
  STA PPU_ADDR    ; write the high byte of $3F00 address
  LDA #$00
  STA PPU_ADDR    ; write the low byte of $3F00 address
  LDX #$00
LoadPalettesLoop:
  LDA palette, x        ;load palette byte
  STA PPU_DATA             ;write to PPU
  INX                   ;set index to next byte
  CPX #$20
  BNE LoadPalettesLoop  ;if x = $20, 32 bytes copied, all done


  LDA PPU_STATUS    ; read PPU status to reset the high/low latch
  LDA #$20
  STA PPU_ADDR    ; write the high byte of $2000 address
  LDA #$00
  STA PPU_ADDR    ; write the low byte of $2000 address


  LDA #LOW(tiles)
  STA ZP_DATA_ADDRESS+0
  LDA #HIGH(tiles)
  STA ZP_DATA_ADDRESS+1

  LDX #$04 ; 4 * 256 = 1024 bytes of data
  ;clear the index
  LDY #$00

CopyByte:
  LDA [ZP_DATA_ADDRESS], y
  STA PPU_DATA             ;write to PPU
  INY                   ;set index to next byte
  BNE CopyByte
  DEX
  BEQ Done

  INC ZP_DATA_ADDRESS+1
  JMP CopyByte

Done:



  STA PPU_CTRL
  LDA #%10010000   ; enable NMI, sprites from Pattern Table 0
  STA PPU_CTRL

  LDA #%00011110   ; enable bg rendering
  STA PPU_MASK

  LDA #$0
  STA PPU_SCROLL
  LDA #$0
  STA PPU_SCROLL

Forever:
  JMP Forever     ;jump back to Forever, infinite loop


NMI:
  LDA ZP_SCROLL_X
  STA PPU_SCROLL
  LDA #$0
  STA PPU_SCROLL

  LDX ZP_SCROLL_X
  INX
  STX ZP_SCROLL_X
  RTI        ; return from interrupt

