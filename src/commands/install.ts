import type { CommandModule } from 'yargs';
import { install } from '../index.js';

interface InstallArgs {
    package: string | undefined;
    flux: boolean;
    'save-dev': boolean;
    offline: boolean;
}

const command: CommandModule<object, InstallArgs> = {
    command: 'install [package]',
    describe: 'Install package(s) from npm registry',
    aliases: ['add'],
    builder: (yargs) =>
        yargs
            .positional('package', {
                description:
                    'The package to install (optional). If not provided, installs project dependencies.',
                type: 'string',
            })
            .option('flux', {
                type: 'boolean',
                description: "Use flux's package registry",
                default: false,
            })
            .option('save-dev', {
                type: 'boolean',
                alias: 'D',
                description: 'Add the package to devDependencies',
                default: false,
            })
            .option('offline', {
                type: 'boolean',
                description: 'Resolve only from the local cache, never hit the network',
                default: false,
            }),
    handler: async (argv) => {
        await install(argv.package ?? null, null, {
            isFlux: argv.flux,
            dev: argv['save-dev'],
            offline: argv.offline,
        });
    },
};

export default command;
