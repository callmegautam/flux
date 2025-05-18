import { update } from '../index.js';

export default {
    command: 'update [package]',
    describe: 'Update a package',
    aliases: ['upgrade'],
    builder: (yargs) => {
        yargs.positional('package', {
            description: 'The package to update (optional). If not provided, updates all packages.',
            type: 'string',
        });
    },
    handler: async (argv) => {
        if (argv.package) {
            await update(argv.package);
        } else {
            await update(null);
        }
    },
};
