import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { gameConfig } from './game-config';
import { extractResources } from './extract';

const toolRoot = resolve(__dirname, '..');
const repoRoot = resolve(__dirname, '../..');

async function readJson(path: string): Promise<unknown> {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
}

async function main(): Promise<void> {
  const config = gameConfig();
  const extracted = await extractResources(config.masterDir, config.dlcDir);
  const communityEnemies = await readJson(resolve(toolRoot, 'input/enemy-names.json'));
  if (Array.isArray(communityEnemies)) {
    const known = new Set(extracted.enemies.map((enemy) => enemy.id));
    for (const row of communityEnemies) {
      if (!row || typeof row !== 'object') continue;
      const id = Number((row as { id?: number }).id);
      const name = (row as { name?: string }).name;
      if (!known.has(id) && name) extracted.enemies.push({ id, name });
    }
    extracted.enemies.sort((a, b) => a.id - b.id);
  }
  const [stages, missionTypes] = await Promise.all([
    readJson(resolve(toolRoot, 'input/stages.json')),
    readJson(resolve(toolRoot, 'input/mission-types.json')),
  ]);
  const directory = resolve(repoRoot, 'data', config.region);
  await mkdir(directory, { recursive: true });
  const files: Record<string, unknown> = {
    characters: extracted.characters,
    enemies: extracted.enemies,
    abilities: extracted.abilities,
    items: extracted.items,
    summons: extracted.summons,
    fields: extracted.fields,
    stages,
    'mission-types': missionTypes,
    missions: extracted.missions,
    talks: extracted.talks,
  };
  for (const [name, value] of Object.entries(files)) {
    await writeFile(resolve(directory, `${name}.json`), `${JSON.stringify(value, null, 2)}\n`);
  }
  console.log(
    `wrote ${directory} (${extracted.characters.length} characters, ${extracted.enemies.length} enemies, ${extracted.abilities.length} abilities, ${extracted.talks.length} talks, ${extracted.missions.length} missions)`,
  );
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
