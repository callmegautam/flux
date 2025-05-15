#!/usr/bin/env node
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import * as timer from '../src/utils/timer.js';
import {
    install,
    uninstall,
    list,
    update,
    updateAll,
    reinstall,
    reinstallAll,
    uninstallAll,
    outdated,
    search,
    init,
    run,
} from '../src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8'));

timer.start();

yargs(hideBin(process.argv))
    .scriptName('flux')
    .version(packageJson.version)
    .usage('$0 <command> [options]')
    .command(
        'init',
        'Create a new package.json file',
        (yargs) => {
            // * Positional arguments or options needed for a basic init
        },
        (argv) => {
            init();
        }
    )
    .alias('init', 'create') // Example alias for init
    .command(
        'install [package]',
        'Install package(s) from npm registry',
        (yargs) => {
            yargs.positional('package', {
                description:
                    'The package to install (optional). If not provided, installs project dependencies.',
                type: 'string',
            });
        },
        (argv) => {
            if (argv.package) {
                install(argv.package);
            } else {
                // If no package name is provided, assume the user wants to install project dependencies
                console.log('No package name provided. Installing project dependencies...');
                install(null); // Assuming your install(null) handles project dependencies
            }
        }
    )
    .alias('install', 'i')
    .alias('install', 'add')
    .command(
        'uninstall <package>',
        'Uninstall a package',
        (yargs) => {
            yargs.positional('package', {
                description: 'The package to uninstall (or "all" to uninstall all)',
                type: 'string',
            });
        },
        (argv) => {
            if (argv.package === 'all') {
                uninstallAll();
            } else {
                uninstall(argv.package);
            }
        }
    )
    .alias('uninstall', 'remove')
    .alias('uninstall', 'rm')
    .alias('uninstall', 'delete')
    .command('list', 'List installed packages', {}, list)
    .alias('list', 'ls')
    .alias('list', 'show')
    .command(
        'update <package>',
        'Update a package',
        (yargs) => {
            yargs.positional('package', {
                description: 'The package to update (or "all" to update all)',
                type: 'string',
            });
        },
        (argv) => {
            if (argv.package === 'all') {
                updateAll();
            } else {
                update(argv.package);
            }
        }
    )
    .alias('update', 'up')
    .alias('update', 'upgrade')
    .command(
        'reinstall <package>',
        'Reinstall a package',
        (yargs) => {
            yargs.positional('package', {
                description: 'The package to reinstall (or "all" to reinstall all)',
                type: 'string',
            });
        },
        (argv) => {
            if (argv.package === 'all') {
                reinstallAll();
            } else {
                reinstall(argv.package);
            }
        }
    )
    .alias('reinstall', 're')
    .alias('reinstall', 're-i')
    .command('outdated', 'List outdated packages', {}, outdated)
    .alias('outdated', 'out')
    .alias('outdated', 'old')
    .alias('outdated', 'new')
    .command(
        'search <package>',
        'Search info about package',
        (yargs) => {
            yargs.positional('package', {
                description: 'The package to search for',
                type: 'string',
            });
        },
        (argv) => {
            search(argv.package);
        }
    )
    .alias('search', 's')
    .alias('search', 'sr')
    .command(
        'run <script>',
        'Run a script in the current project',
        (yargs) => {
            yargs.positional('script', {
                description: 'The script to run',
                type: 'string',
            });
        },
        (argv) => {
            run(argv.script);
        }
    )
    .alias('run', 'r')
    .demandCommand(1, 'You need at least one command before moving on')
    .strict()
    .help()
    .alias('help', 'h').argv;

process.on('SIGINT', () => {
    console.log('\nExiting Flux...');
    process.exit(0);
});

process.on('exit', () => {
    console.log(`\n Processed in ${timer.stop()}`);
});
