import path from 'path';
import { FluxError } from '../utils/errors.js';
import { config } from '../config.js';

const SUPPORTED_ALGORITHMS = new Set(['sha1', 'sha256', 'sha384', 'sha512']);

export interface ParsedIntegrity {
    algorithm: string;
    base64: string;
    hex: string;
}

export const parseIntegrity = (integrity: string): ParsedIntegrity => {
    const separator = integrity.indexOf('-');
    if (separator === -1) {
        throw new FluxError(`Malformed integrity string: ${integrity}`, 'FLUX_BAD_INTEGRITY');
    }

    const algorithm = integrity.slice(0, separator).toLowerCase();
    const base64 = integrity.slice(separator + 1);

    if (!SUPPORTED_ALGORITHMS.has(algorithm)) {
        throw new FluxError(`Unsupported integrity algorithm: ${algorithm}`, 'FLUX_BAD_INTEGRITY');
    }
    if (base64.length === 0) {
        throw new FluxError(`Malformed integrity string: ${integrity}`, 'FLUX_BAD_INTEGRITY');
    }

    const hex = Buffer.from(base64, 'base64').toString('hex');
    if (hex.length < 4) {
        throw new FluxError(`Malformed integrity string: ${integrity}`, 'FLUX_BAD_INTEGRITY');
    }

    return { algorithm, base64, hex };
};

export const integrityFromShasum = (shasum: string): string =>
    `sha1-${Buffer.from(shasum, 'hex').toString('base64')}`;

export const resolveIntegrity = (dist: {
    integrity?: string;
    shasum?: string;
}): string => {
    if (dist.integrity) return dist.integrity;
    if (dist.shasum) return integrityFromShasum(dist.shasum);
    throw new FluxError('Registry entry has neither integrity nor shasum', 'FLUX_BAD_INTEGRITY');
};

const shard = (parsed: ParsedIntegrity): string[] => [
    parsed.algorithm,
    parsed.hex.slice(0, 2),
    parsed.hex.slice(2),
];

export const metadataRoot = (): string => path.join(config.cachePath, 'metadata');
export const tarballRoot = (): string => path.join(config.cachePath, 'tarballs');
export const packageRoot = (): string => path.join(config.cachePath, 'packages');

export const metadataFilePath = (name: string): string =>
    path.join(metadataRoot(), `${encodeURIComponent(name)}.json`);

export const tarballFilePath = (integrity: string): string => {
    const parts = shard(parseIntegrity(integrity));
    const last = parts.pop() as string;
    return path.join(tarballRoot(), ...parts, `${last}.tgz`);
};

export const packageDirPath = (integrity: string): string =>
    path.join(packageRoot(), ...shard(parseIntegrity(integrity)));

export const packageId = (name: string, version: string): string => `${name}@${version}`;
