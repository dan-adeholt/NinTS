export const COLOR_NAMES = {
  LIGHT_GRAY: 0x10,
  DARK_GRAY: 0x2d,
  BLACK: 0x1d,
  WHITE: 0x20,
  NAVY: 0x02,
  MAROON: 0x06,
  BLUE:  0x12,
  LIGHT_BLUE: 0x21,
  PURPLE:  0x14,
  RED:  0x16,
  BROWN:  0x17,
  OLIVE:  0x18,
  GREEN:  0x1A,
  AQUA:  0x1C,
  MAGENTA:  0x24,
  LIME:  0x2A,
  TEAL:  0x2C
};

export const COLORS = new Uint32Array([
  0xFF747474, //00
  0xFF8C1824, //01
  0xFFA80000, //02
  0xFF9C0044, //03
  0xFF74008C, //04
  0xFF1000A8, //05
  0xFF0000A4, //06
  0xFF00087C, //07
  0xFF002C40, //08
  0xFF004400, //09
  0xFF005000, //0A
  0xFF143C00, //0B
  0xFF5C3C18, //0C
  0xFF000000, //0D
  0xFF000000, //0E
  0xFF000000, //0F
  0xFFBCBCBC, //10
  0xFFEC7000, //11
  0xFFEC3820, //12
  0xFFF00080, //13
  0xFFBC00BC, //14
  0xFF5800E4, //15
  0xFF0028D8, //16
  0xFF0C4CC8, //17
  0xFF007088, //18
  0xFF009400, //19
  0xFF00A800, //1A
  0xFF389000, //1B
  0xFF888000, //1C
  0xFF000000, //1D
  0xFF000000, //1E
  0xFF000000, //1F
  0xFFFCFCFC, //20
  0xFFFCBC3C, //21
  0xFFFC945C, //22
  0xFFFC88CC, //23
  0xFFFC78F4, //24
  0xFFB474FC, //25
  0xFF6074FC, //26
  0xFF3898FC, //27
  0xFF3CBCF0, //28
  0xFF10D080, //29
  0xFF48DC4C, //2A
  0xFF98F858, //2B
  0xFFD8E800, //2C
  0xFF787878, //2D
  0xFF000000, //2E
  0xFF000000, //2F
  0xFFFCFCFC, //30
  0xFFFCE4A8, //31
  0xFFFCD4C4, //32
  0xFFFCC8D4, //33
  0xFFFCC4FC, //34
  0xFFD8C4FC, //35
  0xFFB0BCFC, //36
  0xFFA8D8FC, //37
  0xFFA0E4FC, //38
  0xFFA0FCE0, //39
  0xFFBCF0A8, //3A
  0xFFCCFCB0, //3B
  0xFFF0FC9C, //3C
  0xFFC4C4C4, //3D
  0xFF000000, //3E
  0xFF000000  //3F
]);

const COLOR_ATTENUATION = 0.746;

export const COLOR_TABLE = [
  new Uint32Array(COLORS.length),
  new Uint32Array(COLORS.length),
  new Uint32Array(COLORS.length),
  new Uint32Array(COLORS.length),
  new Uint32Array(COLORS.length),
  new Uint32Array(COLORS.length),
  new Uint32Array(COLORS.length),
  new Uint32Array(COLORS.length),
]
for (let mask = 0; mask <= 0b111; mask++) {
  let redFactor = 1.0;
  let greenFactor = 1.0;
  let blueFactor = 1.0;

  // Emphasise red
  if (mask & 0b001) {
    greenFactor = COLOR_ATTENUATION;
    blueFactor = COLOR_ATTENUATION;
  }

  // Green
  if (mask & 0b010) {
    redFactor = COLOR_ATTENUATION;
    blueFactor = COLOR_ATTENUATION;
  }

  // Blue
  if (mask & 0b100) {
    redFactor = COLOR_ATTENUATION;
    greenFactor = COLOR_ATTENUATION;
  }

  for (let i = 0; i < COLORS.length; i++) {
    const color = COLORS[i];
    const r = Math.floor(((color >> 16) & 0b11111111) * redFactor);
    const g = Math.floor(((color >> 8) & 0b11111111) * greenFactor);
    const b = Math.floor(((color) & 0b11111111) * blueFactor);
    COLOR_TABLE[mask][i] = 0xFF000000 | r << 16 | g << 8 | b;
  }
}

export const GREYSCALE_COLOR_TABLE = [
  new Uint32Array(COLORS.length),
  new Uint32Array(COLORS.length),
  new Uint32Array(COLORS.length),
  new Uint32Array(COLORS.length),
  new Uint32Array(COLORS.length),
  new Uint32Array(COLORS.length),
  new Uint32Array(COLORS.length),
  new Uint32Array(COLORS.length),
]

for (let i = 0; i < GREYSCALE_COLOR_TABLE.length; i++) {
  const colorArray = GREYSCALE_COLOR_TABLE[i];
  colorArray.set(COLOR_TABLE[i]);

  for (let j = 0; j < colorArray.length; j++) {
    colorArray[j] = colorArray[j & 0x30];
  }
}
