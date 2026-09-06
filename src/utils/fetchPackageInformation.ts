import axios from 'axios';
import logger from './logger.js';
import { config } from '../config.js';
import { getErrorMessage } from './errors.js';
import type { NpmPackument } from '../types/npm.js';

const MAX_RETRIES = 3;
const BASE_DELAY = 1000;

export const fetchPackageInformation = async (packageName: string): Promise<NpmPackument> => {
    const url = `${config.registry}${packageName}`;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await axios.get<NpmPackument>(url);

            if (response.status !== 200) {
                logger.error(`Failed to fetch package info for ${packageName}. HTTP Status: ${response.status}`);
                throw new Error(`Unexpected HTTP status: ${response.status}`);
            }

            return response.data;
        } catch (error) {
            if (attempt === MAX_RETRIES) {
                logger.error(`Failed to fetch package info for ${packageName} after ${MAX_RETRIES} attempts.`);
                logger.error(`Error details: ${getErrorMessage(error)}`);
                process.exit(1);
            }

            const delay = BASE_DELAY * 2 ** (attempt - 1) + Math.random() * 500;
            logger.warning(`Retrying in ${(delay / 1000).toFixed(2)}s... (Attempt ${attempt}/${MAX_RETRIES})`);

            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }

    throw new Error(`Failed to fetch package info for ${packageName}.`);
};
