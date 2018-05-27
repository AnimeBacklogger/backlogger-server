const { Database } = require('arangojs');
//Async work:
module.exports = async function createCollections(config) {
    
    const db = (new Database({
        url: `http://${config.host}:8529`
    })).useDatabase(config.dbName);
    
    // check expected database exists
    const availableDatabases = await db.listUserDatabases();
    if (!availableDatabases.includes(config.dbName)) {
        throw new Error(`Could not find the Database '${config.dbName}' on the Arango host '${config.host}'.`);
    }

    // Get list of existing collections
    const existingCollections = await db.listCollections();

    function checkAndPromiseCollection(collectionName, collectionType='vert'){
        //check if collection exists    //TODO: add check for collection type
        const existingIndex = existingCollections.findIndex(x => x.name === collectionName);
        if (existingIndex === -1){
            let collection = null;
            if (collectionType === 'vert'){
                collection = db.collection(collectionName);
            } else {
                collection = db.edgeCollection(collectionName);
            }

            return collection.create().catch(err => {
                console.error(`Problem with '${collectionName}'`);
                return Promise.reject(err);
            });
        }
        return Promise.resolve(true);
    }

    //Create the collections
    await Promise.all([
        //Create vertex collections:
        ...config.collections.verts.map(collectionName => checkAndPromiseCollection(collectionName, 'vert')),
        //Create edge collections:
        ...config.collections.edges.map(collectionName => checkAndPromiseCollection(collectionName, 'edge'))
    ]);

    return true;
};
