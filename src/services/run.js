import { readPackageJson } from '../utils/fileSystem.js';
import { exec } from 'child_process';
import logger from '../utils/logger.js';

export const run = async (script) => {
    try {
        const packageJson = await readPackageJson();

        const scripts = packageJson.scripts;
        if (!scripts) {
            logger.error('No scripts found in package.json.');
            process.exit(1);
        }

        if (!scripts[script]) {
            logger.error(`Script ${script} not found in package.json.`);
            process.exit(1);
        }

        const command = scripts[script];

        const child = exec(command, { shell: true });

        child.stdout?.pipe(process.stdout);
        child.stderr?.pipe(process.stderr);

        child.on('exit', (code) => {
            process.exit(code ?? 0);
        });
    } catch (error) {
        logger.error(`Error while running script: ${error}`);
        process.exit(1);
    }
};
