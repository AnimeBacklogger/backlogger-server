'use strict';

const config = require('../../util/configFileHandler').getConfig().arango;

const DB_HOST = config.host;
const DB_NAME = config.database;

const VERT_COLLECTIONS = [
    'users',
    'recommendations',
    'shows',
    'authInformation'
];

const EDGE_COLLECTIONS = [
    'recommendationTo',
    'recommendationFrom',
    'recommendationFor',
    'friendsWith',
    'hasInBacklog',
    'userAuth'
];

module.exports = {
    host: DB_HOST,
    dbName: DB_NAME,
    collections: {
        verts: VERT_COLLECTIONS,
        edges: EDGE_COLLECTIONS
    }
};
