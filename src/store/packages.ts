import fs from 'fs';
import path from 'path';
import * as tar from 'tar';
import { packageDirPath, packageRoot } from './paths.js';
import { pathExists, publishDirAtomic, withTempDir } from './atomic.js';
import { FluxError, getErrorMessage } from '../utils/errors.js';

export const packagePath = (integrity: string): string => packageDirPath(integrity);

export const hasPackage = async (integrity: string): Promise<boolean> =>
    pathExists(path.join(packageDirPath(integrity), 'package.json'));

export const extractPackage = async (
    integrity: string,
    tarballPath: string
): Promise<string> => {
    const target = packageDirPath(integrity);
    if (await hasPackage(integrity)) return target;

    await fs.promises.rm(target, { recursive: true, force: true });

    await withTempDir(packageRoot(), async (staging) => {
        try {
            await tar.x({
                file: tarballPath,
                cwd: staging,
                strip: 1,
                preservePaths: false,
                filter: (entryPath) => !path.isAbsolute(entryPath) && !entryPath.split(/[\\/]/).includes('..'),
            });
        } catch (error) {
            throw new FluxError(
                `Failed to extract ${tarballPath}: ${getErrorMessage(error)}`,
                'FLUX_EXTRACT_ERROR'
            );
        }

        await publishDirAtomic(staging, target);
    });

    return target;
};

export const removePackage = async (integrity: string): Promise<void> => {
    await fs.promises.rm(packageDirPath(integrity), { recursive: true, force: true });
};
