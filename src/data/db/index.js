'use strict';

const { Database } = require('arangojs');
const config = require('./config');

module.exports = (new Database({
    url: `http://${config.host}:8529`
})).useDatabase(config.dbName);
