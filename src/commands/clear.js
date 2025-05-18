import { clearCache } from '../index.js';

export default {
    command: 'clear',
    describe: 'Clear cache or temp installs',
    aliases: ['c'],
    handler: async () => {
        await clearCache();
    },
};
