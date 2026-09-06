import type { CommandModule } from 'yargs';
import { update } from '../index.js';

interface UpdateArgs {
    package: string | undefined;
}

const command: CommandModule<object, UpdateArgs> = {
    command: 'update [package]',
    describe: 'Update a package',
    aliases: ['upgrade'],
    builder: (yargs) =>
        yargs.positional('package', {
            description:
                'The package to update (optional). If not provided, updates all packages.',
            type: 'string',
        }),
    handler: async (argv) => {
        await update(argv.package ?? null);
    },
};

export default command;
