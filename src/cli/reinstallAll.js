import { readPackageJson } from '../utils/fileSystem.js';
import logger from '../utils/logger.js';
import { checkIfAnyPackagesExist } from '../utils/packageJson.js';
import { reinstall } from './reinstall.js';

export const reinstallAll = async () => {
    try {
        await checkIfAnyPackagesExist();
        logger.info('Reinstalling all packages...');
        const packageJson = readPackageJson();
        const dependencies = packageJson.dependencies;
        await checkIfAnyPackagesExist();
        for (const dependency in dependencies) {
            await reinstall(dependency);
        }
    } catch (error) {
        logger.error(`Error while reinstalling packages: ${error.message}`);
    }
};
