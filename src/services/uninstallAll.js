import { readPackageJson } from '../utils/fileSystem.js';
import logger from '../utils/logger.js';
import { checkIfAnyPackagesExist } from '../utils/packageJson.js';
import { uninstall } from './uninstall.js';

export const uninstallAll = async () => {
    try {
        await checkIfAnyPackagesExist();
        const packageJson = await readPackageJson();
        const dependencies = packageJson.dependencies;
        logger.info('Uninstalling all packages...');
        for (const dependency in dependencies) {
            await uninstall(dependency);
        }
        logger.info('All packages uninstalled successfully.');
    } catch (error) {
        logger.error(`Error while uninstalling all packages: ${error}`);
        process.exit(1);
    }
};
