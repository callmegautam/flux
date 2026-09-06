import type { CommandModule } from 'yargs';
import { clearCache } from '../index.js';

const command: CommandModule = {
    command: 'clear',
    describe: 'Clear cache or temp installs',
    aliases: ['c'],
    handler: async () => {
        await clearCache();
    },
};

export default command;
