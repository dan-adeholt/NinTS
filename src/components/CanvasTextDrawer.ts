const charsImage = new Image();
charsImage.src = '/chars.png';

/**
 * These functions are used to draw text on the canvas without having to allocate heap memory.
 * A single buffer is reused for all text drawing operations. Very primitive API, primarily
 * used to show frame timings on top of the emulator screen.
 */
 
export function drawStringBuffer(buffer: Uint8Array, canvasContext: CanvasRenderingContext2D, x: number, y: number, bufLength: number) {
  let curX = x;
  let curY = y;
  
  for (let i = 0; i < bufLength; i++) {
    const char = buffer[i];
    
    if (char === 10) { // New line
      curX = x;
      curY += 8;
      continue;
    }

    const charX = (char % 16) * 8;
    const charY = Math.floor(char / 16) * 8;
    canvasContext.drawImage(charsImage, charX, charY, 8, 8, curX, curY, 8, 8);
    curX += 8;  
  }
}

// As long as we use constant strings as input we should avoid string allocations
export function copyTextToBuffer(buffer: Uint8Array, bufferIndex: number, s: string) {
  for (let i = 0; i < s.length; i++) {
    buffer[bufferIndex + i] = s.charCodeAt(i);
  }

  return bufferIndex + s.length;
}

// Quite unoptimized, but it is run quite seldomly and the purpose is to avoid heap allocations.
export function copyNumberToBuffer(buffer: Uint8Array, bufferIndex: number, num: number) {
  let curBufferIndex = bufferIndex;

  if (num < 0) {
    num = -num;
    if (curBufferIndex < buffer.length) {
      buffer[curBufferIndex++] = 45; // -
    } else {
      return curBufferIndex
    }
  }

  let numInt = Math.floor(num);

  const numDec = Math.round((Math.abs(num) - numInt) * 100);

  if (numInt > 0) {
    const numIntDigits = Math.floor(Math.log10(numInt)) + 1;
  
    if (curBufferIndex + numIntDigits >= buffer.length) {
      return curBufferIndex;
    }
  
    for (let i = 0; i < numIntDigits; i++) {
      const curDigit = numInt % 10;
      numInt /= 10;
      buffer[curBufferIndex + numIntDigits - i - 1] = curDigit + 48;
    }
  
    curBufferIndex += numIntDigits;  
  } else {
    if (curBufferIndex < buffer.length) {
      buffer[curBufferIndex++] = 48; // 0
    } else {
      return curBufferIndex;
    }
  }
  
  if (curBufferIndex < buffer.length) {
    buffer[curBufferIndex++] = 46; // .
  }

  const d1 = Math.floor(numDec / 10);
  const d2 = Math.floor(numDec % 10);

  if (curBufferIndex < buffer.length) {
    buffer[curBufferIndex++] = d1 + 48;
  }

  if (curBufferIndex < buffer.length) {
    buffer[curBufferIndex++] = d2 + 48;
  }  

  return curBufferIndex;
}
