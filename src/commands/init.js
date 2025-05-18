import { init } from '../index.js';

export default {
    command: 'init',
    describe: 'Create a new package.json file',
    aliases: ['create'],
    handler: async () => {
        await init();
    },
};
