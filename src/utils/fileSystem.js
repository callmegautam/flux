import fs from 'fs';
import * as tar from 'tar';
import path from 'path';
import logger from './logger.js';

const currentDir = process.cwd();
const packageJsonPath = path.join(process.cwd(), 'package.json');

export const readPackageJson = async () => {
    try {
        const fileContent = await fs.promises.readFile(packageJsonPath, 'utf8');
        const packageData = await JSON.parse(fileContent);
        return {
            ...packageData,
            dependencies: packageData.dependencies || {},
            devDependencies: packageData.devDependencies || {},
        };
    } catch (error) {
        if (error.code === 'ENOENT') {
            await fs.promises.writeFile(
                packageJsonPath,
                JSON.stringify({ dependencies: {} }, null, 2),
                'utf8'
            );
            return { dependencies: {}, devDependencies: {} };
        } else {
            logger.error(`Error while reading package.json: ${error}`);
        }
        process.exit(1);
    }
};

export const writePackageJson = async (packageData) => {
    try {
        const formattedData = JSON.stringify(packageData, null, 2);
        await fs.promises.writeFile(packageJsonPath, formattedData, 'utf8');
    } catch (error) {
        logger.error(`Error while writing package.json: ${error}`);
        process.exit(1);
    }
};

export const extractPackage = async (packageName, filePath) => {
    try {
        const extractionPath = path.join(currentDir, 'node_modules', packageName);
        const nodeModulesPath = path.join(currentDir, 'node_modules');

        await fs.promises.mkdir(nodeModulesPath, { recursive: true });
        await fs.promises.mkdir(extractionPath, { recursive: true });

        tar.x({ file: filePath, C: extractionPath, strip: 1 });
    } catch (error) {
        logger.error(`Error while extracting package: ${error}`);
        process.exit(1);
    }
    // } finally {
    //     try {
    //         await fs.promises.unlink(filePath);
    //     } catch (err) {
    //         logger.warning(`Could not delete tarball ${filePath}: ${err.message}`);
    //         process.exit(1);
    //     }
    // }
};

export const removePackageFromModule = async (packageName) => {
    try {
        const packagePath = path.join(currentDir, 'node_modules', packageName);
        try {
            await fs.promises.access(packagePath);
        } catch (error) {
            logger.error(`Package ${packageName} is not found.`);
            process.exit(1);
        }

        await fs.promises.rm(packagePath, { recursive: true, force: true });
    } catch (error) {
        logger.error(`Error while deleting package: ${error}`);
        process.exit(1);
    }
};
