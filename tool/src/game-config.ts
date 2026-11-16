import { resolve } from 'node:path';

const PACKAGE_NAME = 'com.square_enix.android_googleplay.DFFOperaOmnian';

export interface GameConfig {
  /** Fallback master version. The archive's mst_data_version wins when it loads. */
  version: string;
  masterDir: string;
  dlcDir: string;
  packageName: string;
}

/** Archive paths for the extractor. Only the global (GL) client is supported. */
export function gameConfig(env: NodeJS.ProcessEnv = process.env): GameConfig {
  const root = env.DFFOO_ARCHIVE_ROOT ?? resolve(__dirname, '../../archive/gb');
  return {
    version: env.DFFOO_MASTER_VERSION ?? '35500000',
    masterDir: env.DFFOO_MASTER_ARCHIVE ?? resolve(root, 'data', 'data', PACKAGE_NAME, 'files'),
    dlcDir: env.DFFOO_DLC_ARCHIVE ?? resolve(root, 'sdcard', 'Android', 'data', PACKAGE_NAME, 'files'),
    packageName: PACKAGE_NAME,
  };
}
