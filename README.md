# Client resources

The map builder and the server's `content:check` name enemies, characters, abilities and items from JSON files under `data/<region>/`. Those files are committed here. The client archive they come from is not.

From `tool/`:

```bash
npm install
npm run extract
```

`npm run extract` reads the master directory from `gameConfig()` (`DFFOO_MASTER_ARCHIVE`, or `archive/<region>/data/data/<package>/files` at the repo root) and the downloaded files directory (`DFFOO_DLC_ARCHIVE`, or `archive/<region>/sdcard/Android/data/<package>/files`). `DFFOO_ARCHIVE_ROOT` replaces `archive/<region>`. It writes `data/<region>/`.

Copy `data/<region>` into the field builder's `resources/<region>` and into the server's `resources/<region>` when those need the names. Both of those folders are git-ignored.

The downloaded files hold the client's `MessageData_*.bin.dz` text tables. A `.dz` file is a 132-byte header (u32 chunk count, which is 1 for these tables, u32 unpacked size, u32 packed size) followed by a zlib stream. The unpacked table is `XL` version 19: a 20-byte header, then one u32 offset per id, relative to the start of that table, then NUL-terminated strings. The first offset is the table length, so it also gives the id count.

## Where names live

The GL master archive stores some tables as XOR-0xFF JSON (`N1` + MD5 of `<name>.json`, read by `loadArchiveMaster`) and others as XOR-0xFF binary with an `XL` header (magic `XL`, version 20, count at +4, a stride at +8, header size 16). The stride in the header is not a reliable record size for every file; the extractors below use the framing that was checked against Chapter 1's known ids.

| Resource | Source | How the name is stored |
|---|---|---|
| Characters | `mst_character.bin` | Record 0 is id 1, Cloud, a C string at +4. Later rows use the 12-byte marker `00 30 FF FF FF FF 01 00 00 00 30 00`, then an int32 id, then a C string. Cloud is 1, Vivi is 2, Warrior of Light is 10, Rem is 13, Tifa is 9, Sazh is 14. |
| Enemies | `MessageData_EnemyName`, then `mst_battle_enemy.json` | The message table is indexed by enemy id and wins: Goblin is 1, Skeleton is 4, Flan is 5, Red Bat is 8, Iron Giant is 14, Behemoth is 15, Floating Eye is 38, Miniature Magitek Armor is 67. Ids past its end come from `mst_battle_enemy.json` (binary, despite the suffix), where the name is a u32 length, then ASCII, then a NUL, 830 bytes after the int32 id. |
| Abilities | `mst_command_ability.bin` | The English name is repeated three times as u32 length + bytes. A length-prefixed description follows. The next int32 is the command ability id (Fire 17, Cross-Slash 20, Shining Shield 44, Aim 51, Beat Rush 52). Later rows reuse the same name for upgraded ids. |
| Items | JSON masters | Crystals: `mst_crystal` (`cr_id`, item type 9). Summon materials: `mst_summon_material` (`sm_id`, item type 10). Equipment orbs: `mst_equipment_material` (`em_id`, item type 11; High Power Orb is 2). Tickets: `mst_ticket` (`ticket_id`, item type 8; Tutorial Draw Ticket is 2). Gil is item type 99 id 1 and gems are type 99 id 2; those two are currency, not master rows, and the extractor adds them itself. |
| Summons | `mst_summon_beast.json` | `summon_beast_id` and `name`. Ifrit is 1. Chocobo is 4. |
| Fields | `mst_field_disp.json` | `field_map_id`, `name`, `story_part`, `stage_id`. |
| Stages | `tool/input/stages.json` | Not in the masters. The client loads model `S<id>Model`. Names in this file are community descriptions. |
| Mission types | `tool/input/mission-types.json` | The committed shorthands map to the types the server already sends. |
| Missions | `MessageData_QuestMissionText` | Indexed by mission type: 2 is "Clear without any KO's", 3 is "Clear within %d turns", 4 is "Inflict %d or more Breaks". |
| Talks | `MessageData_TalkEventTitle` | Indexed by talk id, the number a cutscene site stores as `before_talk`. 4 is "The Warrior of Light", 12 is "SOLDIER", 11 is "The World Beyond". The game server reads this table at runtime and sends the title as a cutscene's quest name, so story files store no cutscene names. The scripts are `talk_event_NNN.bin.dz`. |
| Quest names | none | `MessageData_QuestName` exists, but every entry is empty in the global client. The client shows whatever `name` the server sends (checked on device by renaming quest 361), so battle names are typed by hand. |

## Gaps checked against Chapter 1

The +830 scan of `mst_battle_enemy.json` misses Flan (5), Red Bat (8) and Iron Giant (14). `MessageData_EnemyName` has all three. [tool/input/enemy-names.json](tool/input/enemy-names.json) is kept as a fallback for when the downloaded files are not on disk.

## Files written

`data/<region>/{characters,enemies,abilities,items,summons,fields,stages,mission-types,missions,talks}.json`

Each record has an `id` and a `name`, except items, which have `item_type`, `item_id` and `name`. Abilities also include `description` with the client's `\b` colour codes left in place.
