import type { CommandModule } from 'yargs';
import { install } from '../index.js';

interface InstallArgs {
    package: string | undefined;
    flux: boolean;
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
            }),
    handler: async (argv) => {
        await install(argv.package ?? null, null, argv.flux);
    },
};

export default command;
