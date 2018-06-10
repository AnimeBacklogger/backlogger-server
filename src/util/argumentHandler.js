'use strict';

module.exports = require('yargs')
    .option('config', {
        alias: 'c',
        describe: 'The path to the config file.'
    })
    .argv;
