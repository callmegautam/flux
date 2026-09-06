import { promisify } from 'util';
import { pipeline } from 'stream';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import type { Readable } from 'stream';
import { config } from '../config.js';
import { getErrorMessage } from './errors.js';
import logger from './logger.js';

const pipelineAsync = promisify(pipeline);

const cacheFilePath = (packageName: string, version: string): string =>
    path.join(config.cachePath, ...packageName.split('/'), `${version}.tgz`);

const registryTarballUrl = (packageName: string, version: string): string => {
    const unscopedName = packageName.split('/').pop() ?? packageName;
    return `${config.registry}${packageName}/-/${unscopedName}-${version}.tgz`;
};

const resolveFluxTarballUrl = async (packageName: string, version: string): Promise<string> => {
    try {
        const res = await axios.post<{ data: string; message?: string }>(
            `${config.backendAPI}/package`,
            { packageName, version }
        );

        if (res.status !== 200) {
            logger.error(res.data.message ?? `Failed to fetch package information for ${packageName}`);
            process.exit(1);
        }

        return res.data.data;
    } catch {
        return registryTarballUrl(packageName, version);
    }
};

export const downloadPackage = async (
    packageName: string,
    version: string,
    isFlux = false,
    tarballUrl?: string
): Promise<string> => {
    try {
        const filePath = cacheFilePath(packageName, version);
        if (fs.existsSync(filePath)) {
            return filePath;
        }

        await fs.promises.mkdir(path.dirname(filePath), { recursive: true });

        const fileUrl = isFlux
            ? await resolveFluxTarballUrl(packageName, version)
            : (tarballUrl ?? registryTarballUrl(packageName, version));

        const response = await axios<Readable>({
            url: fileUrl,
            responseType: 'stream',
        });
        const writer = fs.createWriteStream(filePath);
        await pipelineAsync(response.data, writer);

        return filePath;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response) {
                logger.error(`Failed to download ${packageName}. HTTP Status: ${error.response.status}`);
            } else if (error.code === 'ECONNABORTED') {
                logger.error(`Download timed out for ${packageName}`);
            } else {
                logger.error(`Error downloading package ${packageName}: ${error.message}`);
            }
        } else {
            logger.error(`Error downloading package ${packageName}: ${getErrorMessage(error)}`);
        }
        process.exit(1);
    }
};
