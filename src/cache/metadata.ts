import fs from 'fs';
import type { AbbreviatedPackument } from '../types/npm.js';
import { config } from '../config.js';
import { metadataFilePath } from '../store/paths.js';
import { writeFileAtomic } from '../store/atomic.js';
import { getErrorMessage } from '../utils/errors.js';
import type { MetadataFetcher } from '../resolver/registry.js';
import { fetchAbbreviatedPackument } from '../resolver/registry.js';
import logger from '../utils/logger.js';

export interface CachedMetadata {
    name: string;
    packument: AbbreviatedPackument;
    etag?: string;
    fetchedAt: number;
}

export interface GetMetadataOptions {
    exactVersion?: string;
    fetcher?: MetadataFetcher;
    offline?: boolean;
}

const memo = new Map<string, CachedMetadata>();
const inFlight = new Map<string, Promise<CachedMetadata>>();

export const clearMemo = (): void => {
    memo.clear();
    inFlight.clear();
};

export const isFresh = (entry: CachedMetadata, now = Date.now()): boolean =>
    now - entry.fetchedAt < config.metadataTtlMs;

export const read = async (name: string): Promise<CachedMetadata | null> => {
    try {
        const raw = await fs.promises.readFile(metadataFilePath(name), 'utf8');
        const parsed = JSON.parse(raw) as CachedMetadata;
        if (!parsed.packument?.versions) return null;
        return parsed;
    } catch {
        return null;
    }
};

export const write = async (entry: CachedMetadata): Promise<void> => {
    try {
        await writeFileAtomic(metadataFilePath(entry.name), JSON.stringify(entry));
    } catch (error) {
        logger.warning(`Could not cache metadata for ${entry.name}: ${getErrorMessage(error)}`);
    }
};

const hasVersion = (entry: CachedMetadata, version?: string): boolean =>
    version !== undefined && Object.hasOwn(entry.packument.versions, version);

const load = async (name: string, options: GetMetadataOptions): Promise<CachedMetadata> => {
    const fetcher = options.fetcher ?? fetchAbbreviatedPackument;
    const disk = await read(name);

    if (disk) {
        if (options.offline || isFresh(disk) || hasVersion(disk, options.exactVersion)) {
            memo.set(name, disk);
            return disk;
        }
    }

    try {
        const response = await fetcher(name, disk?.etag);

        const entry: CachedMetadata =
            response.notModified && disk
                ? { ...disk, fetchedAt: Date.now() }
                : {
                      name,
                      packument: response.packument,
                      etag: response.etag ?? disk?.etag,
                      fetchedAt: Date.now(),
                  };

        memo.set(name, entry);
        await write(entry);
        return entry;
    } catch (error) {
        if (disk) {
            logger.warning(
                `Using cached metadata for ${name} (registry unreachable: ${getErrorMessage(error)})`
            );
            memo.set(name, disk);
            return disk;
        }
        throw error;
    }
};

export const getMetadata = async (
    name: string,
    options: GetMetadataOptions = {}
): Promise<AbbreviatedPackument> => {
    const cached = memo.get(name);
    if (cached && (options.exactVersion === undefined || hasVersion(cached, options.exactVersion))) {
        return cached.packument;
    }
    if (cached && isFresh(cached)) return cached.packument;

    const pending = inFlight.get(name);
    if (pending) return (await pending).packument;

    const promise = load(name, options).finally(() => inFlight.delete(name));
    inFlight.set(name, promise);
    return (await promise).packument;
};
