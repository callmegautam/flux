import { promisify } from 'util';
import { pipeline } from 'stream';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { config } from '../config.js';
import logger from './logger.js';

const pipelineAsync = promisify(pipeline);
const currentDir = process.cwd();
const drive = currentDir.slice(0, 2);
const storePath = path.join(drive, '.flux-store');

export const downloadPackage = async (packageName, version) => {
    try {
        if (!fs.existsSync(storePath)) {
            fs.mkdirSync(storePath);
        }

        if (fs.existsSync(path.join(storePath, `${packageName}-${version}.tgz`))) {
            return path.join(storePath, `${packageName}-${version}.tgz`);
        }

        const tarballUrl = `${config.registry}${packageName}/-/${packageName}-${version}.tgz`;
        const filePath = path.join(storePath, `${packageName}-${version}.tgz`);
        const response = await axios({
            url: tarballUrl,
            responseType: 'stream',
        });
        const writer = fs.createWriteStream(filePath);
        await pipelineAsync(response.data, writer);

        return filePath;
    } catch (error) {
        if (error.response) {
            logger.error(`Failed to download ${packageName}. HTTP Status: ${error.response.status}`);
        } else if (error.code === 'ECONNABORTED') {
            logger.error(`Download timed out for ${packageName}`);
        } else {
            logger.error(`Error downloading package ${packageName}: ${error.message}`);
        }
        process.exit(1);
    }
};
