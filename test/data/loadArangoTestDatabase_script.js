const { Database } = require('arangojs');
const DATABASE_CONFIG = require('../../src/data/db/config');

const db = (new Database({
    url: `http://${DATABASE_CONFIG.host}:8529`
})).useDatabase(DATABASE_CONFIG.dbName);

require('./loadArangoTestData')(db).then(DATA => {
    console.log(JSON.stringify(DATA, null, '  '));
}).catch(err => {
    console.error('ERROR: ', err.message);
});
