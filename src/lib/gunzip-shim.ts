import { inflate } from 'pako';

class Gunzip {
  private data: Uint8Array;

  constructor(data: Uint8Array) {
    this.data = data;
  }

  decompress(): Uint8Array {
    return inflate(this.data);
  }
}

export const Zlib = { Gunzip };
