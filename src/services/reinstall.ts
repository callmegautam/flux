import fs from 'fs';
import path from 'path';
import { checkIfPackageExists } from '../utils/packageJson.js';
import { getErrorMessage } from '../utils/errors.js';
import { unlinkRoot } from '../store/linker.js';
import { relinkProject } from './relink.js';
import logger from '../utils/logger.js';

export const reinstall = async (packageName: string | null): Promise<void> => {
    try {
        const projectDir = process.cwd();

        if (packageName === null) {
            await checkIfPackageExists();
            logger.info('Reinstalling all packages...');
            await fs.promises.rm(path.join(projectDir, 'node_modules'), {
                recursive: true,
                force: true,
            });
            await relinkProject(projectDir);
            logger.success('All packages reinstalled successfully.');
            return;
        }

        await checkIfPackageExists(packageName);
        logger.info(`Reinstalling ${packageName}...`);

        await unlinkRoot(projectDir, packageName);
        await relinkProject(projectDir);
        logger.success(`${packageName} reinstalled successfully.`);
    } catch (error) {
        logger.error(`Error while reinstalling package: ${getErrorMessage(error)}`);
        process.exit(1);
    }
};
