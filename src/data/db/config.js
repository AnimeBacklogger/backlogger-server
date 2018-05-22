const DB_HOST= '192.168.13.37';
const DB_NAME= 'backlogger';

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