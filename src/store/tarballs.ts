import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { pipeline } from 'stream/promises';
import axios from 'axios';
import type { Readable } from 'stream';
import { config } from '../config.js';
import { parseIntegrity, tarballFilePath } from './paths.js';
import { pathExists, tempPathFor } from './atomic.js';
import { FluxError, getErrorMessage } from '../utils/errors.js';
import logger from '../utils/logger.js';

export const tarballPath = (integrity: string): string => tarballFilePath(integrity);

export const hasTarball = async (integrity: string): Promise<boolean> =>
    pathExists(tarballFilePath(integrity));

const registryTarballUrl = (packageName: string, version: string): string => {
    const unscopedName = packageName.split('/').pop() ?? packageName;
    return `${config.registry}${packageName}/-/${unscopedName}-${version}.tgz`;
};

export const resolveFluxTarballUrl = async (
    packageName: string,
    version: string
): Promise<string> => {
    try {
        const response = await axios.post<{ data: string; message?: string }>(
            `${config.backendAPI}/package`,
            { packageName, version }
        );
        if (response.status !== 200 || typeof response.data.data !== 'string') {
            return registryTarballUrl(packageName, version);
        }
        return response.data.data;
    } catch {
        return registryTarballUrl(packageName, version);
    }
};

export interface FetchTarballRequest {
    name: string;
    version: string;
    tarball: string;
    integrity: string;
}

export const fetchTarball = async (
    request: FetchTarballRequest,
    options: { useFluxRegistry?: boolean } = {}
): Promise<string> => {
    const target = tarballFilePath(request.integrity);
    if (await pathExists(target)) return target;

    const { algorithm, base64 } = parseIntegrity(request.integrity);
    const url = options.useFluxRegistry
        ? await resolveFluxTarballUrl(request.name, request.version)
        : (request.tarball || registryTarballUrl(request.name, request.version));

    await fs.promises.mkdir(path.dirname(target), { recursive: true });
    const temp = tempPathFor(target);

    try {
        const response = await axios<Readable>({ url, responseType: 'stream' });
        const hash = crypto.createHash(algorithm);

        await pipeline(
            response.data,
            async function* (source: AsyncIterable<Buffer>) {
                for await (const chunk of source) {
                    hash.update(chunk);
                    yield chunk;
                }
            },
            fs.createWriteStream(temp)
        );

        const digest = hash.digest('base64');
        if (digest !== base64) {
            throw new FluxError(
                `Integrity check failed for ${request.name}@${request.version}: expected ${algorithm}-${base64}, got ${algorithm}-${digest}`,
                'FLUX_INTEGRITY_MISMATCH'
            );
        }

        await fs.promises.rename(temp, target);
        return target;
    } catch (error) {
        await fs.promises.rm(temp, { force: true });

        if (error instanceof FluxError) throw error;

        if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            throw new FluxError(
                status
                    ? `Failed to download ${request.name}@${request.version}. HTTP ${status}`
                    : `Failed to download ${request.name}@${request.version}: ${error.message}`,
                'FLUX_DOWNLOAD_ERROR'
            );
        }

        throw new FluxError(
            `Failed to download ${request.name}@${request.version}: ${getErrorMessage(error)}`,
            'FLUX_DOWNLOAD_ERROR'
        );
    }
};

export const verifyTarball = async (integrity: string): Promise<boolean> => {
    const target = tarballFilePath(integrity);
    const { algorithm, base64 } = parseIntegrity(integrity);

    try {
        const hash = crypto.createHash(algorithm);
        await pipeline(fs.createReadStream(target), hash);
        return hash.digest('base64') === base64;
    } catch (error) {
        logger.warning(`Could not verify cached tarball: ${getErrorMessage(error)}`);
        return false;
    }
};
