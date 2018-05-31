'use strict';

// Functionality to retreive user information.
// This represents the API for the rest of the system.
// If you swap out backends (mongodb/mysql/postGres/redis) or scrapers, then this is were you change
// code to point to the new access methods.
const bcrypt = require('bcrypt');
const {
    UserNotFoundError, NonUniqueUserError, UserPasswordNotSetError, ShowNotFoundError
} = require('./dataErrors');
const schemas = require('./schemas');
const Logger = require('../util/Logger');

const db = require('./db');
const { aql } = require('arangojs');
const {
    filterDbFields, flattenBacklogData, flattenBacklogAndRecommendations, flattenFriends, flattenUsersRecommendations
} = require('./db/dataManipulation');

// FIXME: Create configuration variable for this.
const BCRYPT_ROUNDS = Number.parseInt(process.env.BCRYPT_ROUNDS, 10) || 5;

/**
 * Takes in an array and gives you back the first result.
 * But if there's 0 results, throws a `UserNotFoundError`
 * and if there's >1 results, throws a `NonUniqueUserError`
 * @param {Array} userDataRows rows of data, where there should only be 1 if the user was uniquely identified
 * @param {string} userName the name of the user searched for
 * @throws {NonUniqueUserError}
 * @throws {UserNotFoundError}
 * @returns {Object} First result (if not throwing)
 */
function checkUserCount(userDataRows, userName) {
    // First result or bust
    if (userDataRows.length === 1) {
        return userDataRows[0];
    } else if (userDataRows.length > 1) {
        return Promise.reject(
            new NonUniqueUserError(`Multiple users found for name '${userName}': ${JSON.stringify(userDataRows.map(x => x.user._id))}`)
        );
    }
    return Promise.reject(new UserNotFoundError(`User '${userName}' not found`));
}

/**
 *
 * @param {string} name name of user
 * @param {Boolean} returnId whether to return user Id if found;
 * @returns {Promise} {Boolean} Returns true if user exists, false if not. Or,if `returnId`, returns the _id field if it exists, else false
 */
async function checkIfUserExists(name, returnId = false) {
    const data = await db.query(aql`FOR u IN users FILTER u.name==${name} RETURN u`).then(cursor => cursor.all());
    if (returnId && data[0]) {
        return data[0]._id || false;
    }
    return !!(data.length);
}

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
 * @param {string} name the name of the user.
 * @returns {UserObject} Details of the user, as seen in the user schema area
*/
async function getUserInfoByName(name) {
    return db.query(aql`
        FOR u IN users 
            FILTER u.name==${name} 
            LET friends = (FOR f,e IN 1..1 ANY u friendsWith RETURN {friendInfo: f, edge: e})
            LET backlog = (FOR b,e IN 1..1 OUTBOUND u hasInBacklog RETURN {show:b, edge: e})
            LET recommendations = (
                FOR r,e IN 1..1 INBOUND u recommendationTo
                RETURN {
                    rec: r, 
                    edge:e,
                    show: (FOR s IN 1..1 OUTBOUND r recommendationFor RETURN s)[0],
                    user: (FOR ru IN 1..1 OUTBOUND r recommendationFrom RETURN ru)[0]
                }
            )
            RETURN {
                user: u, 
                friends: friends,
                backlog: backlog,
                recommendations: recommendations
            }
    `).then(cursor => cursor.all()).then(data => checkUserCount(data, name))
        .then(data => {
            const backlog = flattenBacklogAndRecommendations(data.backlog, data.recommendations);
            const friends = flattenFriends(data.friends);

            return filterDbFields(Object.assign(
                {},
                data.user,
                {
                    backlog,
                    friends
                }
            ));
        });
}

/**
 * @param {string} name username
 * @param {string} password the plaintext password
 * @returns {Promise<Boolean>} A promise that returns true if the password for the use is correct.
 * @throws {UserPasswordNotSetError} if user does not have a password set
 */
async function validateUserLogin(name, password) {
    return db.query(aql`
        FOR u IN users 
            FILTER u.name==${name}
            RETURN {
                user: u.name,
                auth: (FOR a,e IN 1..1 OUTBOUND u userAuth 
                    RETURN a
                )
            }
    `).then(cursor => cursor.all())
        .then(data => checkUserCount(data, name))
        .then(({ auth }) => {
            if (auth) {
                // Find index with a password hash:
                const index = auth.findIndex(authData => authData.hash);
                if (index !== -1) {
                    return auth[index].hash;
                }
            }
            return Promise.reject(new UserPasswordNotSetError(`No password found for ${name}`));
        })
        .then(hash => bcrypt.compare(password, hash));
}

/**
 * @param {string} name user's name
 * @returns {Promise<Array>} a user's backlog
 */
async function getUserBacklog(name) {
    return db.query(aql`
        FOR u IN users 
            FILTER u.name==${name} 
            RETURN {
                name: u.name,
                backlog: (FOR b,e IN 1..1 OUTBOUND u hasInBacklog 
                    RETURN {show:b, edge: e}
                )
            }
    `).then(cursor => cursor.all()).then(data => checkUserCount(data, name)).then(data => flattenBacklogData(data.backlog));
}

/**
 * @param {string} name user's name
 * @returns {Promise<Array>} An array of recommendations made by the user
 */
async function getRecommendationsCreatedByUser(name) {
    // TODO:

    return db.query(aql`
        FOR u IN users 
            FILTER u.name==${name}
            RETURN {
                name: u.name,
                recs: (FOR r IN 1..1 INBOUND u recommendationFrom 
                    RETURN {
                        rec: r,
                        show: (FOR s IN 1..1 OUTBOUND r recommendationFor RETURN s)[0],
                        to: (FOR s IN 1..1 OUTBOUND r recommendationTo RETURN s)[0]
                    }
                )
            }
    `).then(cursor => cursor.all()).then(data => checkUserCount(data, name))
        .then(({ recs }) => flattenUsersRecommendations(recs))
        .then(data => filterDbFields(data, name));
}

//------------------------------
// Setters
//------------------------------
/**
 * @param {string} user user's name
 * @param {string} oldPass user's old password
 * @param {string} newPass user's requested new password
 * @returns {Promise<Boolean>} true if password change successful. False if password mismatch
 */
async function setUserPassword(user, oldPass, newPass) {
    return validateUserLogin(user, oldPass).catch(err => {
        if (err instanceof UserPasswordNotSetError) {
            return true;
        }
        return Promise.reject(err);
    }).then(res => {
        if (res) {
            return bcrypt.hash(newPass, BCRYPT_ROUNDS)
                .then(nHash => db.query(aql`
                    FOR u IN users 
                        FILTER u.name==${user} 
                        FOR a,e IN 1..1 OUTBOUND u userAuth 
                            UPDATE a WITH {hash: ${nHash}} IN authInformation
                `)).then(() => true);
        }
        return false;
    });
}

/**
 * 
 * @param {string} user The user's name
 * @param {Array} backlogOrderArray an Array of backlog reorder objects, in the format {name:<showName>, order: <new integer order value>} 
 * @returns {Promise} a promise that the updates have occurred
 * @throws {UserNotFoundError} the given user does not exist
 * @throws {Error} One of the shows was not present in the user's backlog
 * @throws {Error} duplicate entry found for a show.
 */
async function updateUserBacklogOrdering(user, backlogOrderArray) {
    const userId = await checkIfUserExists(user);
    if (!userId) {
        throw new UserNotFoundError(`Unable to find user '${user}'`);
    }
    if (!Array.isArray(backlogOrderArray)) {
        throw new TypeError('backlogOrderArray must be array');
    }

    // TODO: Use this to get showIds, so we match better (and match in one place in the code) 
    const showNames = backlogOrderArray.reduce((acc, { name }) => {
        if (acc.includes(name)) {
            throw Error(`Duplicate entry for show: '${name}'`);
        } else {
            acc.push(name);
        }
        return acc;
    }, []);

    return db.query(aql`
        FOR u IN users
            FILTER u.name =='Chrolo'
                FOR s,b IN 1..1 OUTBOUND u hasInBacklog
                    RETURN {
                        show: s,
                        backlogEdge: b
                    }
        `).then(cursor => cursor.all())
        .then(currentBacklog => {
            // Match up edges and orders
            backlogOrderArray.map(orderItem => {
                const index = currentBacklog.findIndex(x => x.show.name === orderItem.name);

                if (index === -1) {
                    // TODO: Make this a more specific error class
                    throw new Error(`Show [${orderItem.name}] was not in [${user}]'s backlog`);
                }

                return {
                    backlogEdgeId: currentBacklog[index].backlogEdge._id,
                    newOrder: orderItem.order
                }
            });
        })
        .then(reorderData => {
            // FIXEME: batch update of matching edges
            console.log(`Reorder data is ${JSON.stringify(reorderData, null, 2)}`);
        });
}

//------------------------------
// Creators
//------------------------------
/**
 * @param {Object} userDataObject an object defining a user, as in ../schemas/user/index.schema.json
 * @returns {Promise} A Promise of the user being added to the database.
 */
async function addUser(userDataObject) {
    // Check userData is correct format
    const ajvInst = schemas.getAjvInstance();
    const validator = ajvInst.compile(schemas.getSchemaById('user/index.schema.json'));
    if (!validator(userDataObject)) {
        throw new TypeError(JSON.stringify(validator.errors));
    }
    // Verify user doesn't already exist:
    if (await checkIfUserExists(userDataObject.name)) {
        throw new NonUniqueUserError(`A user under the name '${userDataObject.name}' already exists in the database.`);
    }
    // -- Add the user vert -- //
    const userVert = await db.collection('users').save({ name: userDataObject.name, malVerified: userDataObject.malVerified }, { returnNew: true });

    // -- Add the auth vert and edge --//
    // hash the password
    const signIn = userDataObject.signIn || {};
    if (signIn.password) {
        Logger.debug('data/user::addUser', `Adding login information for ${userDataObject.name}`);
        signIn.hash = await bcrypt.hash(signIn.password, BCRYPT_ROUNDS);
        delete signIn.password;
    } else {
        Logger.info('data/user::addUser', `No initial login information presented when adding ${userDataObject.name}.`);
    }
    const authVert = await db.collection('authInformation').save(signIn, { returnNew: true });
    await db.collection('userAuth').save({ _from: userVert._id, _to: authVert._id });

    return true;
}
/**
 * @param {string} toUsername the user whom the recommendation is for.
 * @param {string} fromUsername the user who made the recommendation
 * @param {string} showName the name of the show the recommendation is for
 * @param {Object} recommendation recommendation data object.
 * @returns {Promise} a promise of the recommendation being added to the database
 */
async function addRecommendation(toUsername, fromUsername, showName, recommendation) {
    // Check user exists
    const toUserId = await checkIfUserExists(toUsername, true);
    if (!toUserId) {
        throw new UserNotFoundError(`User '${toUsername}' not found`);
    }
    const fromUserId = await checkIfUserExists(fromUsername, true);
    if (!fromUserId) {
        throw new UserNotFoundError(`User '${fromUsername}' not found`);
    }
    // Check show exists
    const showId = await checkIfShowExistsByName(showName, true);
    if (!showId) {
        throw new ShowNotFoundError(`Show '${showName}' not found.`);
    }

    // TODO: validate recommendation data

    // Add recommendation vert
    const recommendationVert = await db.collection('recommendations').save(recommendation, { returnNew: true });
    // Add edges
    await db.collection('recommendationTo').save({ _from: recommendationVert._id, _to: toUserId });
    await db.collection('recommendationFrom').save({ _from: recommendationVert._id, _to: fromUserId });
    await db.collection('recommendationFor').save({ _from: recommendationVert._id, _to: showId });

    return true;
}

//--------------------------------
// Module Exports:
//--------------------------------
module.exports = {
    addUser,
    addRecommendation,
    getRecommendationsCreatedByUser,
    getUserInfoByName,
    getUserBacklog,
    setUserPassword,
    updateUserBacklogOrdering,
    validateUserLogin
};
