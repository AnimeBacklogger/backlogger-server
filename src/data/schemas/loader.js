'use strict';

// Functions to get the object schemas.
const path = require('path');

const SCHEMA_ID_PREFIX = 'BACKLOGGER_SCHEMAS/';

/**
 * @param {string} id the schema ID to prefix
 * @returns {string} the id with a prefix
 */
function prefixSchemaId(id) {
    return SCHEMA_ID_PREFIX + id;
}

/**
 *
 * @param {string} schemaPath a file path to the schema
 * @returns {Object} the schema (with modified $id field)
 */
function loadSchema(schemaPath) {
    // Make sure it's absolute:
    schemaPath = path.isAbsolute(schemaPath) ? schemaPath : path.resolve(schemaPath);   // eslint-disable-line no-param-reassign

    // Get a schemaId from it: (and keep it posix)
    const schemaId = path.relative(__dirname, schemaPath).replace(/\\/g, '/');

    // attempt to load the file: (with deep copy)
    const schema = JSON.parse(JSON.stringify(require(schemaPath))); // eslint-disable-line global-require,import/no-dynamic-require

    // Set the new schema id
    schema['$id'] = prefixSchemaId(schemaId);

    return schema;
}
/**
 * This is a recursive function designed to deeply search an object and replace instances of a given key
 * It will modify the given object. (It does not create a new copy)
 * @param {Object} object the object in which substitutions need to be made
 * @param {string} key the key that needs to have substitutions made
 * @param {Function} replaceFunc a function that takes the value at that key and returns a new value.
 * @returns {Object} The object with all relevant keys replaced.
 */
function objectKeyFinder(object, key, replaceFunc) {
    /* eslint-disable no-param-reassign */
    if (typeof object === 'object') {
        // make a copy:
        if (object instanceof Array) {
            return object.map(x => objectKeyFinder(x, key, replaceFunc));
        }
        // if not array, go through keys:
        Object.keys(object).forEach(objKey => {
            if (objKey === key) {
                object[objKey] = replaceFunc(object[objKey]);
            } else {
                object[objKey] = objectKeyFinder(object[objKey], key, replaceFunc);
            }
        });
        return object;
    }
    // not object:
    return object;
    /* eslint-enable no-param-reassign */
}

module.exports = {
    prefixSchemaId,
    objectKeyFinder,
    loadSchema
};
