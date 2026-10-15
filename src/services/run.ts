import path from 'path';
import { spawn } from 'child_process';
import { readPackageJson } from '../utils/fileSystem.js';
import { getErrorMessage } from '../utils/errors.js';
import logger from '../utils/logger.js';

export const run = async (script: string): Promise<void> => {
    try {
        const projectDir = process.cwd();
        const packageJson = await readPackageJson(projectDir);

        const scripts = packageJson.scripts;
        if (!scripts) {
            logger.error('No scripts found in package.json.');
            process.exit(1);
        }

        const command = scripts[script];
        if (!command) {
            logger.error(`Script ${script} not found in package.json.`);
            process.exit(1);
        }

        const binDir = path.join(projectDir, 'node_modules', '.bin');
        const child = spawn(command, {
            shell: true,
            stdio: 'inherit',
            cwd: projectDir,
            env: {
                ...process.env,
                PATH: `${binDir}${path.delimiter}${process.env.PATH ?? ''}`,
            },
        });

        child.on('exit', (code) => process.exit(code ?? 0));
    } catch (error) {
        logger.error(`Error while running script: ${getErrorMessage(error)}`);
        process.exit(1);
    }
};
