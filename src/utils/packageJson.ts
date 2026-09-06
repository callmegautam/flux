import { readPackageJson, writePackageJson } from './fileSystem.js';
import logger from './logger.js';

export const addPackageToJson = async (packageName: string, version: string): Promise<void> => {
    try {
        const packageJson = await readPackageJson();
        packageJson.dependencies[packageName] = version;
        await writePackageJson(packageJson);
    } catch (error) {
        logger.error(`Error while adding package to package.json: ${error}`);
    }
};

export const checkIfAnyPackagesExist = async (): Promise<void> => {
    try {
        const packageJson = await readPackageJson();
        if (Object.keys(packageJson.dependencies).length === 0) {
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
            if (Object.keys(packageJson.dependencies).length === 0) {
                logger.info('No dependencies found.');
                process.exit(1);
            }
            return;
        }

        if (!packageJson.dependencies[packageName]) {
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
        if (!packageJson.dependencies[packageName]) {
            logger.error(`Package ${packageName} is not found.`);
            process.exit(1);
        }
        delete packageJson.dependencies[packageName];
        await writePackageJson(packageJson);
    } catch (error) {
        logger.error(`Error while removing package from package json : ${error}`);
    }
};
