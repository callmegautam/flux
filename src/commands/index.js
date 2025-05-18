import init from './init.js';
import install from './install.js';
import uninstall from './uninstall.js';
import list from './list.js';
import update from './update.js';
import reinstall from './reinstall.js';
import outdated from './outdated.js';
import run from './run.js';
import info from './info.js';
import clear from './clear.js';

export default function registerCommands(yargs) {
    [
        init,
        install,
        uninstall,
        list,
        update,
        reinstall,
        outdated,
        run,
        info,
        clear,
    ].forEach((command) => yargs.command(command));
}
