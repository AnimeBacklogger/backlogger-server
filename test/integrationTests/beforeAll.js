/*global before */
const path = require('path');

// Load the integration test configuration into the system config:
const configLoader = require('../../src/util/configFileHandler');
configLoader.loadSettingsFromFile(path.resolve(__dirname, './integrationTestConfig.json'));

const Logger = require('../../src/util/Logger');
Logger.setLogLevel(configLoader.getConfig().logger.level, true);
const { Database } = require('arangojs');
const DATABASE_CONFIG = require('../../src/data/db/config');

// connect to the database.
const db = (new Database({
    url: `http://${DATABASE_CONFIG.host}:8529`
})).useDatabase(DATABASE_CONFIG.dbName);

before(async () => {
    console.log(''.padEnd(25, '-'));
    console.log('Setting up Database');
    Logger.debug('Integration Test Database Config', JSON.stringify(DATABASE_CONFIG, null, '  '));
    console.log(''.padEnd(25, '-'));
    
    // Setup the collections
    await require('../../src/data/db/setupFunctions')(DATABASE_CONFIG);
    
    //Load in the integration test data.
    await require('../data/loadArangoTestData')(db);

});

module.exports= {
    db
};
