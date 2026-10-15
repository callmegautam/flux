import fs from 'fs';
import { config } from '../config.js';
import { metadataRoot, packageRoot, tarballRoot } from '../store/paths.js';
import { getErrorMessage } from '../utils/errors.js';
import logger from '../utils/logger.js';

export interface CacheCleanOptions {
    metadata?: boolean;
    tarballs?: boolean;
    packages?: boolean;
    all?: boolean;
}

const directorySize = async (target: string): Promise<number> => {
    let total = 0;

    const walk = async (dir: string): Promise<void> => {
        const entries = await fs.promises.readdir(dir, { withFileTypes: true }).catch(() => []);
        for (const entry of entries) {
            const full = `${dir}/${entry.name}`;
            if (entry.isDirectory()) await walk(full);
            else if (entry.isFile()) {
                const stats = await fs.promises.stat(full).catch(() => null);
                if (stats) total += stats.size;
            }
        }
    };

    await walk(target);
    return total;
};

const human = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let value = bytes;
    let unit = 0;
    while (value >= 1024 && unit < units.length - 1) {
        value /= 1024;
        unit++;
    }
    return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
};

export const cacheDir = (): void => {
    console.log(config.cachePath);
};

export const cacheInfo = async (): Promise<void> => {
    const layers: Array<[string, string]> = [
        ['metadata', metadataRoot()],
        ['tarballs', tarballRoot()],
        ['packages', packageRoot()],
    ];

    logger.info(`Cache root: ${config.cachePath}`);
    for (const [name, dir] of layers) {
        logger.package(`${name.padEnd(10)} ${human(await directorySize(dir))}`);
    }
};

export const cacheClean = async (options: CacheCleanOptions = {}): Promise<void> => {
    try {
        const selected = options.metadata || options.tarballs || options.packages;
        const targets: Array<[string, string]> = [];

        if (options.all || !selected) {
            targets.push(['cache', config.cachePath]);
        } else {
            if (options.metadata) targets.push(['metadata', metadataRoot()]);
            if (options.tarballs) targets.push(['tarballs', tarballRoot()]);
            if (options.packages) targets.push(['packages', packageRoot()]);
        }

        for (const [name, dir] of targets) {
            await fs.promises.rm(dir, { recursive: true, force: true });
            logger.success(`Cleared ${name}.`);
        }
    } catch (error) {
        logger.error(`Error while clearing cache: ${getErrorMessage(error)}`);
        process.exit(1);
    }
};
