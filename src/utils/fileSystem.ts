import fs from 'fs';
import * as tar from 'tar';
import path from 'path';
import logger from './logger.js';
import type { PackageJson } from '../types/package-json.js';

const currentDir = process.cwd();
const packageJsonPath = path.join(process.cwd(), 'package.json');

export const readPackageJson = async (): Promise<PackageJson> => {
    try {
        const fileContent = await fs.promises.readFile(packageJsonPath, 'utf8');
        const packageData = JSON.parse(fileContent) as PackageJson;
        return {
            ...packageData,
            dependencies: packageData.dependencies || {},
            devDependencies: packageData.devDependencies || {},
        };
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
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

export const writePackageJson = async (packageData: PackageJson): Promise<void> => {
    try {
        const formattedData = JSON.stringify(packageData, null, 2);
        await fs.promises.writeFile(packageJsonPath, formattedData, 'utf8');
    } catch (error) {
        logger.error(`Error while writing package.json: ${error}`);
        process.exit(1);
    }
};

export const extractPackage = async (packageName: string, filePath: string): Promise<void> => {
    try {
        const extractionPath = path.join(currentDir, 'node_modules', packageName);
        const nodeModulesPath = path.join(currentDir, 'node_modules');

        await fs.promises.mkdir(nodeModulesPath, { recursive: true });
        await fs.promises.mkdir(extractionPath, { recursive: true });

        await tar.x({ file: filePath, C: extractionPath, strip: 1 });
    } catch (error) {
        logger.error(`Error while extracting package: ${error}`);
        process.exit(1);
    }
};

export const removePackageFromModule = async (packageName: string): Promise<void> => {
    try {
        const packagePath = path.join(currentDir, 'node_modules', packageName);
        try {
            await fs.promises.access(packagePath);
        } catch {
            logger.error(`Package ${packageName} is not found.`);
            process.exit(1);
        }

        await fs.promises.rm(packagePath, { recursive: true, force: true });
    } catch (error) {
        logger.error(`Error while deleting package: ${error}`);
        process.exit(1);
    }
};
