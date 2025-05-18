import { install } from '../index.js';

export default {
    command: 'install [package]',
    describe: 'Install package(s) from npm registry',
    aliases: ['add'],
    builder: (yargs) => {
        yargs.positional('package', {
            description: 'The package to install (optional). If not provided, installs project dependencies.',
            type: 'string',
        });
    },
    handler: async (argv) => {
        if (argv.package) {
            await install(argv.package);
        } else {
            await install(null);
        }
    },
};
