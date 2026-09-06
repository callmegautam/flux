import type { CommandModule } from 'yargs';
import { run } from '../index.js';

interface RunArgs {
    script: string;
}

const command: CommandModule<object, RunArgs> = {
    command: 'run <script>',
    describe: 'Run a script in the current project',
    aliases: ['r'],
    builder: (yargs) =>
        yargs.positional('script', {
            description: 'The script to run',
            type: 'string',
            demandOption: true,
        }),
    handler: async (argv) => {
        await run(argv.script);
    },
};

export default command;
