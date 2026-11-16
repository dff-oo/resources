import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export function masterArchiveFileName(name: string): string {
  const digest = createHash('md5').update(`${name}.json`, 'utf8').digest('hex');
  return `N1${digest}`;
}

export async function loadArchiveMaster(
  directory: string,
  name: string,
): Promise<Record<string, unknown> | unknown[] | null> {
  try {
    const encoded = await readFile(join(directory, masterArchiveFileName(name)));
    const decoded = Buffer.from(encoded.map((byte) => byte ^ 0xff));
    const parsed: unknown = JSON.parse(decoded.toString('utf8'));
    return parsed && typeof parsed === 'object'
      ? (parsed as Record<string, unknown> | unknown[])
      : null;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
}
