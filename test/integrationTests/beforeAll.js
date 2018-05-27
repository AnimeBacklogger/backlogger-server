/*global before */

const { Database } = require('arangojs');
const DATABASE_CONFIG = require('../../src/data/db/config');

const TEST_DATABASE_CONFIG = Object.assign(
    JSON.parse(JSON.stringify(DATABASE_CONFIG)),
    {
        dbName: `${DATABASE_CONFIG.dbName}_test`
    }
);

// connect to the database.
const db = (new Database({
    url: `http://${TEST_DATABASE_CONFIG.host}:8529`
})).useDatabase(TEST_DATABASE_CONFIG.dbName);

before(async () => {
    console.log(''.padEnd(25, '-'));
    console.log('Setting up Database');
    console.log(''.padEnd(25, '-'));
    
    // Setup the collections
    await require('../../src/data/db/setupFunctions')(TEST_DATABASE_CONFIG);
    
    
    //Load in the integration test data.
    await require('../data/loadArangoTestData')(db);
    
    //Print out auth info
    await db.query('FOR a IN authInformation RETURN a').then(c => c.all()).then(console.log);
    console.log(''.padEnd(25, '-'));
});

module.exports= {
    db
};
