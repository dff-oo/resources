import { resolve } from 'node:path';

export type GameRegion = 'gb' | 'jp';

const PACKAGES: Record<GameRegion, string> = {
  gb: 'com.square_enix.android_googleplay.DFFOperaOmnian',
  jp: 'com.square_enix.android_googleplay.DFFOperaOmniaj',
};

export interface GameConfig {
  region: GameRegion;
  /** Fallback master version. The archive's mst_data_version wins when it loads. */
  version: string;
  masterDir: string;
  dlcDir: string;
  packageName: string;
}

/** Archive paths for the extractor. The default archive is archive/<region> at the repo root. */
export function gameConfig(env: NodeJS.ProcessEnv = process.env): GameConfig {
  const region: GameRegion = env.DFFOO_REGION === 'jp' ? 'jp' : 'gb';
  const packageName = PACKAGES[region];
  const root = env.DFFOO_ARCHIVE_ROOT ?? resolve(__dirname, '../../archive', region);
  return {
    region,
    version: env.DFFOO_MASTER_VERSION ?? (region === 'gb' ? '35500000' : '0'),
    masterDir:
      env.DFFOO_MASTER_ARCHIVE ?? resolve(root, 'data', 'data', packageName, 'files'),
    dlcDir: env.DFFOO_DLC_ARCHIVE ?? resolve(root, 'sdcard', 'Android', 'data', packageName, 'files'),
    packageName,
  };
}
