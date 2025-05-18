import { uninstall } from '../index.js';

export default {
    command: 'uninstall [package]',
    describe: 'Uninstall a package',
    aliases: ['remove', 'rm', 'delete'],
    builder: (yargs) => {
        yargs.positional('package', {
            description: 'The package to uninstall (optional). If not provided, uninstalls all packages.',
            type: 'string',
        });
    },
    handler: async (argv) => {
        if (argv.package) {
            await uninstall(argv.package);
        } else {
            await uninstall(null);
        }
    },
};
