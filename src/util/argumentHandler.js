const argv = require('yargs')
    .option('config', {
        alias: 'c',
        describe: 'The path to the config file.'
    })
    .argv;

module.exports= argv;
