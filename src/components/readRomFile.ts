import { parseROM } from '../emulator/parseROM';

export type RomFileEntry = {
  sha: string
  data: Uint8Array
  filename: string
}

// Reads and validates a ROM file, rejects if the file is not a supported ROM.
export const readRomFile = async (file: File): Promise<RomFileEntry> => {
  const data = new Uint8Array(await file.arrayBuffer());
  const rom = parseROM(data);
  return { sha: rom.romSHA, data, filename: file.name };
}

export const errorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}
