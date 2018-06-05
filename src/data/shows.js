'use strict';

// Functionality for accessing 'show' data
// This represents the API for the rest of the system.
// If you swap out backends (mongodb/mysql/postGres/redis) or scrapers, then this is were you change
// code to point to the new access methods.
const { NonUniqueShowError } = require('./dataErrors');
const schemas = require('./schemas');
const Logger = require('../util/Logger');

const db = require('./db');
const { aql } = require('arangojs');

/**
 *
 * @param {string} name name of show
 * @param {Boolean} returnId whether to return show Id if found;
 * @returns {Promise} {Boolean} Returns true if shows exists, false if not.  Or,if `returnId`, returns the _id field if it exists, else false
 */
async function checkIfShowExistsByName(name, returnId = false) {
    const data = await db.query(aql`FOR s IN shows FILTER s.name==${name} RETURN s`).then(cursor => cursor.all());
    if (returnId && data[0]) {
        return data[0]._id || false;
    }
    return !!(data.length);
}

/**
 * @param {Object} data The data for the new show
 * @returns {Promise} a promise that the data is saved to the database
 */
async function addShowToDatabase(data) {
    // ensure data conforms to schema
    const validator = schemas.getAjvInstance().compile(schemas.getSchemaById('anime/index.schema.json'));
    if (!validator(data)) {
        Logger.info('addShowToDatabase', 'Data format in show data');
        Logger.debug('addShowToDatabase', 'Data format error in show data', validator.errors);
        throw new TypeError('Show data was invalid');
    }

    if (await checkIfShowExistsByName(data.name)) {
        throw new NonUniqueShowError(`Show '${data.name}' already exists on database`);
    }

    return db.collection('shows').save(data);
}


module.exports = {
    addShowToDatabase,
    checkIfShowExistsByName
};
