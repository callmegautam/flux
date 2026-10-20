import { readPackageJson, writePackageJson } from '../utils/fileSystem.js';
import { getErrorMessage } from '../utils/errors.js';
import logger from '../utils/logger.js';
import { checkIfPackageExists } from '../utils/packageJson.js';
import { relinkProject } from './relink.js';

export const uninstall = async (packageName: string | null): Promise<void> => {
    try {
        const projectDir = process.cwd();
        const packageJson = await readPackageJson();

        if (packageName === null) {
            await checkIfPackageExists();
            logger.info('Uninstalling all packages...');
            packageJson.dependencies = {};
            packageJson.devDependencies = {};
            await writePackageJson(packageJson);
            await relinkProject(projectDir);
            logger.success('All packages uninstalled successfully.');
            return;
        }

        await checkIfPackageExists(packageName);
        logger.info(`Uninstalling package: ${packageName}...`);

        delete packageJson.dependencies[packageName];
        delete packageJson.devDependencies[packageName];
        await writePackageJson(packageJson);

        await relinkProject(projectDir);
        logger.success(`${packageName} uninstalled successfully.`);
    } catch (error) {
        logger.error(`Error while uninstalling package: ${getErrorMessage(error)}`);
        process.exit(1);
    }
};
