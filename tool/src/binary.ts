import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/** XOR-0xFF master blob, or null when the archive has no such file. */
export async function loadXorMaster(directory: string, name: string): Promise<Buffer | null> {
  const digest = createHash('md5').update(name).digest('hex');
  try {
    const encoded = await readFile(join(directory, `N1${digest}`));
    return Buffer.from(encoded.map((byte) => byte ^ 0xff));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
}

export function cString(buffer: Buffer, offset: number): string {
  const end = buffer.indexOf(0, offset);
  const stop = end < 0 ? buffer.length : end;
  return buffer.subarray(offset, stop).toString('utf8');
}
