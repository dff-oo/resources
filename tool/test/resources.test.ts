import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { gameConfig } from '../src/game-config';
import { extractResources } from '../src/extract';

async function main(): Promise<void> {
  const { masterDir, dlcDir } = gameConfig();
  if (!existsSync(masterDir)) {
    console.log('resources skipped (no local archive)');
    return;
  }
  const resources = await extractResources(masterDir, dlcDir);
  const name = (rows: { id: number; name: string }[], id: number) => rows.find((row) => row.id === id)?.name;
  assert.equal(name(resources.characters, 1), 'Cloud');
  assert.equal(name(resources.characters, 2), 'Vivi');
  assert.equal(name(resources.characters, 9), 'Tifa');
  assert.equal(name(resources.characters, 10), 'Warrior of Light');
  assert.equal(name(resources.characters, 14), 'Sazh');
  assert.equal(name(resources.enemies, 1), 'Goblin');
  assert.equal(name(resources.enemies, 4), 'Skeleton');
  assert.equal(name(resources.enemies, 15), 'Behemoth');
  assert.equal(name(resources.enemies, 38), 'Floating Eye');
  assert.equal(name(resources.abilities, 17), 'Fire');
  assert.equal(name(resources.abilities, 20), 'Cross-Slash');
  assert.equal(name(resources.abilities, 44), 'Shining Shield');
  assert.equal(name(resources.abilities, 51), 'Aim');
  assert.equal(name(resources.abilities, 52), 'Beat Rush');
  const item = (type: number, id: number) =>
    resources.items.find((row) => row.item_type === type && row.item_id === id)?.name;
  assert.equal(item(99, 2), 'Gems');
  assert.equal(item(8, 2), 'Tutorial Draw Ticket');
  assert.equal(item(11, 2), 'High Power Orb');
  assert.equal(item(10, 101), 'Gale Adamite');
  assert.equal(item(9, 1), 'Red Shard');
  assert.equal(name(resources.summons, 4), 'Chocobo');
  assert.ok(resources.fields.some((field) => field.id === 1 && field.name.length > 0));
  if (existsSync(dlcDir)) {
    assert.equal(name(resources.enemies, 5), 'Flan');
    assert.equal(name(resources.enemies, 8), 'Red Bat');
    assert.equal(name(resources.enemies, 14), 'Iron Giant');
    assert.equal(name(resources.talks, 4), 'The Warrior of Light');
    assert.equal(name(resources.talks, 12), 'SOLDIER');
    assert.equal(name(resources.talks, 11), 'The World Beyond');
    assert.equal(name(resources.missions, 3), 'Clear within %d turns');
  }
  console.log('resources passed');
}

void main();
