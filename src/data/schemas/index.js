// Loads all the schemas in current and subdirectories, using pattern './**/*.schema.json'
const path = require('path');
const fs = require('fs');
const loader = require('./loader');

//Get AJV setup
const Ajv = require('ajv');

const LOADED_SCHEMAS = {};

function loadSchemas(){
    return getListOfSchemaFiles().then(schemasToLoad => {
        schemasToLoad.forEach(schemaFile => {
            const loaded = loader.loadSchema(schemaFile);
            LOADED_SCHEMAS[loaded['$id']] = loaded;
        });
        return LOADED_SCHEMAS;
    });
}

function getListOfSchemaFiles(dir=__dirname, recurse= true){
    return new Promise((res, rej) => {
        fs.readdir(dir, (e, files) => {
            if(e){
                rej(e);
            } else {
                Promise.all(
                    //Load all the paths
                    files.map(fileDescriptor => {
                        const fullFilePath = path.resolve(dir, fileDescriptor);
                        return new Promise((x, y) => {
                            if(recurse && fs.lstatSync(fullFilePath).isDirectory()){
                                //if a directory (and set to recurse), recurse
                                getListOfSchemaFiles(fullFilePath).then(x, y);
                            } else {
                                x(fullFilePath);
                            }
                        });
                    }))
                    .then(results => {
                        //Need to flatten the results:
                        return results.reduce((acc, f) => {
                            if(f instanceof Array){
                                acc.push(...f);
                            } else {
                                acc.push(f);
                            }
                            return acc;
                        }, []);
                    })
                    .then(results => {
                        //filter to only `*.schema.json`
                        return results.filter(f => (/.*\.schema\.json$/).test(f));
                    })
                    .then(res);
            }
        });
    });
}

function getAjvInstance(){
    const ajv = new Ajv({
        allErrors: true,    //TODO: Make this a DEV env only setting
        verbose: true,      //TODO: Make this a DEV env only setting
        extendRefs: 'fail'
    });
    Object.keys(LOADED_SCHEMAS).forEach((schemaId) => {
        ajv.addSchema(LOADED_SCHEMAS[schemaId]);
    });
    return ajv;
}

function getSchemaById(id){
    return LOADED_SCHEMAS[loader.prefixSchemaId(id)];
}

//Auto load on module startup
loadSchemas();

module.exports= {
    getAjvInstance,
    getListOfSchemaFiles,
    loadSchemas,
    LOADED_SCHEMAS,
    getSchemaById
};
