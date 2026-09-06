#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import * as timer from '../src/utils/timer.js';
import logger from '../src/utils/logger.js';
import registerCommands from '../src/commands/index.js';
import { VERSION } from '../src/version.js';

timer.start();

const flux = yargs(hideBin(process.argv));

flux.scriptName('flux').version(VERSION).usage('$0 <command> [options]');

registerCommands(flux);

void flux
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
