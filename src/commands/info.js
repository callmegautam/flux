import { info } from '../index.js';

export default {
    command: 'info <package>',
    describe: 'Show info about a package',
    aliases: ['i'],
    builder: (yargs) => {
        yargs.positional('package', {
            description: 'The package to show info about',
            type: 'string',
        });
    },
    handler: async (argv) => {
        await info(argv.package);
    },
};
