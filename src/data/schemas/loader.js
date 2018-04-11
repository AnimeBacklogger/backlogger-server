//Functions to get the object schemas.
const path = require('path');

const SCHEMA_ID_PREFIX = 'BACKLOGGER_SCHEMAS/';

function prefixSchemaId(id){
    return SCHEMA_ID_PREFIX + id;
}

function loadSchema(schemaPath){
    //Make sure it's absolute:
    schemaPath = path.isAbsolute(schemaPath) ? schemaPath: path.resolve(schemaPath);

    //Get a schemaId from it: (and keep it posix)
    const schemaId = path.relative(__dirname, schemaPath).replace(/\\/g, '/');

    //attempt to load the file: (with deep copy)
    const schema = JSON.parse(JSON.stringify(require(schemaPath)));

    //Set the new schema id
    schema['$id'] = prefixSchemaId(schemaId);

    return schema;
}

function objectKeyFinder(object, key, replaceFunc){
    if(typeof object === 'object'){
        //make a copy:
        if(object instanceof Array){
            return object.map(x => objectKeyFinder(x, key, replaceFunc));
        }
        //if not array, go through keys:
        Object.keys(object).forEach(objKey => {
            if(objKey === key){
                object[objKey] = replaceFunc(object[objKey]);
            } else {
                object[objKey] = objectKeyFinder(object[objKey], key, replaceFunc);
            }
        });
        return object;
    }
    //not object:
    return object;
}

module.exports= {
    prefixSchemaId,
    objectKeyFinder,
    loadSchema
};
