import type { CommandModule } from 'yargs';
import { init } from '../index.js';

const command: CommandModule = {
    command: 'init',
    describe: 'Create a new package.json file',
    aliases: ['create'],
    handler: async () => {
        await init();
    },
};

export default command;
