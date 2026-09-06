import type { CommandModule } from 'yargs';
import { reinstall } from '../index.js';

interface ReinstallArgs {
    package: string | undefined;
}

const command: CommandModule<object, ReinstallArgs> = {
    command: 'reinstall [package]',
    describe: 'Reinstall a package',
    aliases: ['re', 're-i'],
    builder: (yargs) =>
        yargs.positional('package', {
            description:
                'The package to reinstall (optional). If not provided, reinstalls all packages.',
            type: 'string',
        }),
    handler: async (argv) => {
        await reinstall(argv.package ?? null);
    },
};

export default command;
