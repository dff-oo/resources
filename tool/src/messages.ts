import { readdirSync, readFileSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { inflateSync } from 'node:zlib';

/** The zlib stream in a single-chunk .dz starts after a fixed header. */
const DZ_HEADER = 132;
const XL_HEADER = 20;

/** .dz container: u32 chunk count, u32 unpacked size, u32 packed size, then zlib at 132. */
export function readDz(buffer: Buffer): Buffer {
  const chunks = buffer.readUInt32LE(0);
  if (chunks !== 1) throw new Error(`unsupported .dz with ${chunks} chunks`);
  const unpacked = inflateSync(buffer.subarray(DZ_HEADER, DZ_HEADER + buffer.readUInt32LE(8)));
  if (unpacked.length !== buffer.readUInt32LE(4)) throw new Error('.dz size mismatch');
  return unpacked;
}

/**
 * MessageData_*.bin: an XL header (version 19), then one u32 offset per id, then
 * NUL-terminated strings. Offsets are relative to the table, so the first one is
 * the table's length and gives the id count.
 */
export function readMessages(buffer: Buffer): string[] {
  if (buffer.toString('latin1', 0, 2) !== 'XL') throw new Error('not an XL message table');
  const count = buffer.readUInt32LE(XL_HEADER) / 4;
  const strings: string[] = [];
  for (let id = 0; id < count; id += 1) {
    const start = XL_HEADER + buffer.readUInt32LE(XL_HEADER + id * 4);
    const end = buffer.indexOf(0, start);
    strings.push(buffer.toString('utf8', start, end < 0 ? buffer.length : end));
  }
  return strings;
}

async function findFile(directory: string, fileName: string): Promise<string | null> {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
  const wanted = fileName.toLowerCase();
  for (const entry of entries) {
    if (entry.isFile() && entry.name.toLowerCase() === wanted) return join(directory, entry.name);
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const found = await findFile(join(directory, entry.name), fileName);
    if (found) return found;
  }
  return null;
}

/** A MessageData table from the downloaded files, indexed by id, or null when it is absent. */
export async function loadMessages(dlcDir: string, name: string): Promise<string[] | null> {
  const path = await findFile(dlcDir, `${name}.bin.dz`);
  if (!path) return null;
  return readMessages(readDz(await readFile(path)));
}

function findFileSync(directory: string, fileName: string): string | null {
  let entries;
  try {
    entries = readdirSync(directory, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
  const wanted = fileName.toLowerCase();
  const file = entries.find((entry) => entry.isFile() && entry.name.toLowerCase() === wanted);
  if (file) return join(directory, file.name);
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const found = findFileSync(join(directory, entry.name), fileName);
    if (found) return found;
  }
  return null;
}

export function loadMessagesSync(dlcDir: string, name: string): string[] | null {
  const path = findFileSync(dlcDir, `${name}.bin.dz`);
  return path ? readMessages(readDz(readFileSync(path))) : null;
}

export function namedRows(strings: string[] | null): { id: number; name: string }[] {
  return (strings ?? []).flatMap((name, id) => (name ? [{ id, name }] : []));
}
