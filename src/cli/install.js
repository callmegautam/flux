import { addPackageToJson } from '../utils/packageJson.js';
import { downloadPackage } from '../utils/downloadPackage.js';
import { extractPackage, readPackageJson } from '../utils/fileSystem.js';
import { fetchPackageInformation } from '../utils/fetchPackageInformation.js';
import logger from '../utils/logger.js';
import { config } from '../config.js';
import axios from 'axios';
//
import { promisify } from 'util';
import { pipeline } from 'stream';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { config } from '../config.js';
import logger from './logger.js';

export const install = async (packageName, customVersion = null) => {
    try {
        if (packageName === null) {
            const packageJson = await readPackageJson();

            if (packageJson.dependencies && Object.keys(packageJson.dependencies).length > 0) {
                for (const [packageName, version] of Object.entries(packageJson.dependencies)) {
                    if (version.startsWith('^')) {
                        await install(packageName);
                    } else {
                        await install(packageName, version);
                    }
                }
            } else {
                logger.info('No dependencies found in package.json. Nothing to install.');
                process.exit(1);
            }
            return;
        }

        const data = await fetchPackageInformation(packageName);
        const version = customVersion || data['dist-tags'].latest;
        // const filePath = await downloadPackage(packageName, version);
        // await extractPackage(packageName, filePath);

        const tarballUrl = `${config.registry}${packageName}/-/${packageName}-${version}.tgz`;

        const response = await axios({
            url: tarballUrl,
            responseType: 'stream',
        });

        await new Promise((resolve, reject) => {
            response.data
                .pipe(tar.x({ C: path.join(process.cwd(), 'node_modules', packageName), strip: 1 }))
                .on('finish', resolve)
                .on('error', reject);
        });

        await addPackageToJson(packageName, version);
        console.log('packageName', packageName);
        logger.success(`Package ${packageName}@${version} installed successfully.`);
    } catch (error) {
        logger.error(`Error while installing package: ${error}`);
        process.exit(1);
    }
};
