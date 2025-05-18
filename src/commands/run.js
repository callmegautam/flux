import { run } from '../index.js';

export default {
    command: 'run <script>',
    describe: 'Run a script in the current project',
    aliases: ['r'],
    builder: (yargs) => {
        yargs.positional('script', {
            description: 'The script to run',
            type: 'string',
        });
    },
    handler: async (argv) => {
        await run(argv.script);
    },
};
