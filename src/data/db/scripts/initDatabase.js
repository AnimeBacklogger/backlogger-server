const { Database } = require('arangojs');
const config = require('../config');

/* eslint-disable no-console*/ //Because this is a script

const db = (new Database({
    url: `http://${config.host}:8529`
})).useDatabase(config.dbName);

//Async work:
(async function (){
   // check expected database exists
    const availableDatabases = await db.listUserDatabases();
    if(!availableDatabases.includes(config.dbName)){
        console.error(`Could not find the Database '${config.dbName}' on the Arango host '${config.host}'.`);
        process.exit(1);
    }

    //Create the collections
    await Promise.all([
        //Create vertex collections:
        ...config.collections.verts.map(collectionName => db.collection(collectionName).create()),
        //Create edge collections:
        ...config.collections.edges.map(collectionName => db.edgeCollection(collectionName).create())
    ]);

    return true;
})()