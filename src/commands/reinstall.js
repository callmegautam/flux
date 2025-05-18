import { reinstall } from '../index.js';

export default {
    command: 'reinstall [package]',
    describe: 'Reinstall a package',
    aliases: ['re', 're-i'],
    builder: (yargs) => {
        yargs.positional('package', {
            description: 'The package to reinstall (optional). If not provided, reinstalls all packages.',
            type: 'string',
        });
    },
    handler: async (argv) => {
        if (argv.package) {
            await reinstall(argv.package);
        } else {
            await reinstall(null);
        }
    },
};
