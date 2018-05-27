const config = require('../config');

/* eslint-disable no-console*/ //Because this is a script

require('../setupFunctions')(config).catch(err => {
    console.error(''.padStart(20, '-'));
    console.error(`Error trying to initialise database: ${err.message}`);
    console.error(err.stack);
    console.error(''.padStart(20, '-'));
});