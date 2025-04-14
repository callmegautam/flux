import chalk from 'chalk';

const logger = {
    info: (message) => console.log(chalk.blue('[INFO]'), message),
    success: (message) => console.log(chalk.green('[SUCCESS]'), message),
    warning: (message) => console.log(chalk.yellow('[WARNING]'), message),
    error: (message) => console.error(chalk.red('[ERROR]'), message),
    package: (message) =>
        console.error(chalk.magentaBright('[PACKAGE]'), message),
};

export default logger;
