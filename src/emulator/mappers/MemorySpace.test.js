import MemorySpace from './MemorySpace';

test('Mapping works correctly', () => {
  const memorySpace = new MemorySpace(16384);
  let sourceBuf = new Uint8Array(2048);
  for (let i = 0; i < sourceBuf.length; i++) {
    sourceBuf[i] = i % 256;
  }

  memorySpace.map(sourceBuf, 0x0000, 0, 2048);

  for (let i = 0; i < sourceBuf.length; i++) {
    expect(memorySpace.read(i)).toEqual(sourceBuf[i]);
  }
})
