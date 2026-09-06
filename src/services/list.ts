import { readPackageJson } from '../utils/fileSystem.js';
import logger from '../utils/logger.js';
import { checkIfAnyPackagesExist } from '../utils/packageJson.js';

export const list = async (): Promise<void> => {
    try {
        const packageJson = await readPackageJson();
        await checkIfAnyPackagesExist();
        logger.info('Dependencies:');
        Object.entries(packageJson.dependencies).forEach(([packageName, version]) => {
            logger.package(`- ${packageName}@${version}`);
        });

        const devEntries = Object.entries(packageJson.devDependencies);
        if (devEntries.length === 0) {
            logger.info('No devDependencies found.');
            return;
        }
        logger.info('Dev Dependencies:');
        devEntries.forEach(([packageName, version]) => {
            logger.package(`- ${packageName}@${version}`);
        });
    } catch (error) {
        logger.error(`Error while listing packages: ${error}`);
        process.exit(1);
    }
};
