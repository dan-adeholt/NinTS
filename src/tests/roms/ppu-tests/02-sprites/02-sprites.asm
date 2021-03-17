  .bank 1
  .org $E000
palette:
  .db $0F,$31,$32,$33,$0F,$35,$36,$37,$0F,$39,$3A,$3B,$0F,$3D,$3E,$0F
  .db $0F,$1C,$15,$14,$0F,$02,$38,$3C,$0F,$1C,$15,$14,$0F,$02,$38,$3C

  .include "../util/constants.asm"
  .include "../util/testcase.asm"

  
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

  LDX #$00
  LDY #$8
  
WriteSprite:  
  TYA
  STA $0200,X      ; put sprite 0 in center ($80) of screen vert
  TYA
  STA $0200,X      ; put sprite 0 in center ($80) of screen vert

  STA $0203,X        ; put sprite 0 in center ($80) of screen horiz
  LDA #$2
  STA $0201,X        ; tile number
  LDA #$00
  STA $0202,X        ; color = 0, no flipping
  TXA
  CLC
  ADC #$04
  TAX
  TYA
  ADC #$12
  TAY
  CPX #$34
  BNE WriteSprite

  

  LDA #%10000000   ; enable NMI, sprites from Pattern Table 0
  STA $2000

  LDA #%00010000   ; enable sprites
  STA $2001

Forever:
  JMP Forever     ;jump back to Forever, infinite loop


NMI:
  LDA #$00
  STA PPU_OAM_ADDR  ; set the low byte (00) of the RAM address
  LDA #$02
  STA OAM_DMA  ; set the high byte (02) of the RAM address, start the transfer

  RTI        ; return from interrupt

;;;;;;;;;;;;;;



;;;;;;;;;;;;;;


  .bank 2
  .org $0000
  .incbin "../util/tiles.chr"
