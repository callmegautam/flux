#!/usr/bin/env node
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import * as timer from '../src/utils/timer.js';
import logger from '../src/utils/logger.js';
import registerCommands from '../src/commands/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(
    readFileSync(join(__dirname, '../package.json'), 'utf8')
);

timer.start();

const flux = yargs(hideBin(process.argv));

flux.scriptName('flux').version(packageJson.version).usage('$0 <command> [options]');

registerCommands(flux);

flux
    .demandCommand(1, 'You need at least one command before moving on')
    .strict()
    .help()
    .alias('help', 'h').argv;

process.on('SIGINT', () => {
    logger.info('Exiting gracefully...');
    process.exit(0);
});

process.on('exit', () => {
    console.log(`\n Processed in ${timer.stop()}`);
});
