import type { CommandModule } from 'yargs';
import { uninstall } from '../index.js';

interface UninstallArgs {
    package: string | undefined;
}

const command: CommandModule<object, UninstallArgs> = {
    command: 'uninstall [package]',
    describe: 'Uninstall a package',
    aliases: ['remove', 'rm', 'delete'],
    builder: (yargs) =>
        yargs.positional('package', {
            description:
                'The package to uninstall (optional). If not provided, uninstalls all packages.',
            type: 'string',
        }),
    handler: async (argv) => {
        await uninstall(argv.package ?? null);
    },
};

export default command;
