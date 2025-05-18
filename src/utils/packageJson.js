import { readPackageJson, writePackageJson } from './fileSystem.js';
import logger from './logger.js';

export const addPackageToJson = async (packageName, version) => {
    try {
        const packageJson = await readPackageJson();
        packageJson.dependencies[packageName] = version;
        await writePackageJson(packageJson);
    } catch (error) {
        logger.error(`Error while adding package to package.json: ${error}`);
    }
};

export const checkIfAnyPackagesExist = async () => {
    try {
        const packageJson = await readPackageJson();
        if (
            !packageJson.dependencies ||
            Object.keys(packageJson.dependencies).length === 0
        ) {
            logger.info('No dependencies found.');
            process.exit(1);
        }
    } catch (error) {
        logger.error(`Error while checking package.json: ${error}`);
    }
};

export const checkIfPackageExists = async (packageName = null) => {
    try {
        const packageJson = await readPackageJson();

        if (packageName === null) {
            if (
                !packageJson.dependencies ||
                Object.keys(packageJson.dependencies).length === 0
            ) {
                logger.info('No dependencies found.');
                process.exit(1);
            }
            return;
        }

        if (!packageJson.dependencies || !packageJson.dependencies[packageName]) {
            logger.error(`Package ${packageName} is not found.`);
            process.exit(1);
        }
    } catch (error) {
        logger.error(`Error while checking package.json: ${error}`);
    }
};

export const removePackageFromJson = async (packageName) => {
    try {
        const packageJson = await readPackageJson();
        if (!packageJson.dependencies || !packageJson.dependencies[packageName]) {
            logger.error(`Package ${packageName} is not found.`);
            process.exit(1);
        }
        delete packageJson.dependencies[packageName];
        await writePackageJson(packageJson);
    } catch (error) {
        logger.error(`Error while removing package from package json : ${error}`);
    }
};
