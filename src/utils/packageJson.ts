import { readPackageJson, writePackageJson } from './fileSystem.js';
import logger from './logger.js';

export const addPackageToJson = async (
    packageName: string,
    range: string,
    dev = false
): Promise<void> => {
    try {
        const packageJson = await readPackageJson();
        if (dev) packageJson.devDependencies[packageName] = range;
        else packageJson.dependencies[packageName] = range;
        await writePackageJson(packageJson);
    } catch (error) {
        logger.error(`Error while adding package to package.json: ${error}`);
    }
};

export const checkIfAnyPackagesExist = async (): Promise<void> => {
    try {
        const packageJson = await readPackageJson();
        if (
            Object.keys(packageJson.dependencies).length === 0 &&
            Object.keys(packageJson.devDependencies).length === 0
        ) {
            logger.info('No dependencies found.');
            process.exit(1);
        }
    } catch (error) {
        logger.error(`Error while checking package.json: ${error}`);
    }
};

export const checkIfPackageExists = async (packageName: string | null = null): Promise<void> => {
    try {
        const packageJson = await readPackageJson();

        if (packageName === null) {
            if (
                Object.keys(packageJson.dependencies).length === 0 &&
                Object.keys(packageJson.devDependencies).length === 0
            ) {
                logger.info('No dependencies found.');
                process.exit(1);
            }
            return;
        }

        if (!packageJson.dependencies[packageName] && !packageJson.devDependencies[packageName]) {
            logger.error(`Package ${packageName} is not found.`);
            process.exit(1);
        }
    } catch (error) {
        logger.error(`Error while checking package.json: ${error}`);
    }
};

export const removePackageFromJson = async (packageName: string): Promise<void> => {
    try {
        const packageJson = await readPackageJson();
        if (!packageJson.dependencies[packageName] && !packageJson.devDependencies[packageName]) {
            logger.error(`Package ${packageName} is not found.`);
            process.exit(1);
        }
        delete packageJson.dependencies[packageName];
        delete packageJson.devDependencies[packageName];
        await writePackageJson(packageJson);
    } catch (error) {
        logger.error(`Error while removing package from package json : ${error}`);
    }
};
