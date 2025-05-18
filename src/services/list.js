import { readPackageJson } from '../utils/fileSystem.js';
import logger from '../utils/logger.js';
import { checkIfAnyPackagesExist } from '../utils/packageJson.js';

export const list = async () => {
    try {
        const packageJson = await readPackageJson();
        await checkIfAnyPackagesExist();
        logger.info('Dependencies:');
        Object.keys(packageJson?.dependencies || {}).forEach((packageName) => {
            logger.package(`- ${packageName}@${packageJson.dependencies[packageName]}`);
        });

        if (!packageJson.devDependencies || Object.keys(packageJson?.devDependencies).length === 0) {
            logger.info('No devDependencies found.');
            return;
        }
        logger.info('Dev Dependencies:');
        Object.keys(packageJson?.devDependencies).forEach((packageName) => {
            logger.package(`- ${packageName}@${packageJson.devDependencies[packageName]}`);
        });
    } catch (error) {
        logger.error(`Error while listing packages: ${error}`);
        process.exit(1);
    }
};
