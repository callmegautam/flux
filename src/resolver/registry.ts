import axios from 'axios';
import type { AbbreviatedPackument } from '../types/npm.js';
import { config } from '../config.js';
import { FluxError, getErrorMessage } from '../utils/errors.js';
import logger from '../utils/logger.js';

const MAX_RETRIES = 3;
const BASE_DELAY = 1000;

export const ABBREVIATED_ACCEPT =
    'application/vnd.npm.install-v1+json; q=1.0, application/json; q=0.8, */*';

export interface RegistryResponse {
    packument: AbbreviatedPackument;
    etag?: string;
    notModified: boolean;
}

export type MetadataFetcher = (name: string, etag?: string) => Promise<RegistryResponse>;

const isRetryable = (error: unknown): boolean => {
    if (!axios.isAxiosError(error)) return true;
    const status = error.response?.status;
    if (status === undefined) return true;
    return status >= 500 || status === 429;
};

export const fetchAbbreviatedPackument: MetadataFetcher = async (name, etag) => {
    const url = `${config.registry}${name.split('/').map(encodeURIComponent).join('/')}`;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await axios.get<AbbreviatedPackument>(url, {
                headers: {
                    Accept: ABBREVIATED_ACCEPT,
                    ...(etag ? { 'If-None-Match': etag } : {}),
                },
                validateStatus: (status) => status === 200 || status === 304,
            });

            if (response.status === 304) {
                return { packument: {} as AbbreviatedPackument, notModified: true, etag };
            }

            const responseEtag = response.headers['etag'];

            return {
                packument: response.data,
                notModified: false,
                etag: typeof responseEtag === 'string' ? responseEtag : undefined,
            };
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                throw new FluxError(`Package '${name}' was not found in the registry.`, 'FLUX_NOT_FOUND');
            }

            if (attempt === MAX_RETRIES || !isRetryable(error)) {
                throw new FluxError(
                    `Failed to fetch metadata for '${name}': ${getErrorMessage(error)}`,
                    'FLUX_REGISTRY_ERROR'
                );
            }

            const delay = BASE_DELAY * 2 ** (attempt - 1) + Math.random() * 500;
            logger.warning(
                `Retrying '${name}' in ${(delay / 1000).toFixed(2)}s... (Attempt ${attempt}/${MAX_RETRIES})`
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }

    throw new FluxError(`Failed to fetch metadata for '${name}'.`, 'FLUX_REGISTRY_ERROR');
};
