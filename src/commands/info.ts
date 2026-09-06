import type { CommandModule } from 'yargs';
import { info } from '../index.js';

interface InfoArgs {
    package: string;
}

const command: CommandModule<object, InfoArgs> = {
    command: 'info <package>',
    describe: 'Show info about a package',
    aliases: ['i'],
    builder: (yargs) =>
        yargs.positional('package', {
            description: 'The package to show info about',
            type: 'string',
            demandOption: true,
        }),
    handler: async (argv) => {
        await info(argv.package);
    },
};

export default command;
