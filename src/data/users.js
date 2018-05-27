// Functionality to retreive user information.
// This represents the API for the rest of the system.
// If you swap out backends (mongodb/mysql/postGres/redis) or scrapers, then this is were you change
// code to point to the new access methods.
const bcrypt = require('bcrypt');
const { UserNotFoundError, NonUniqueUserError, UserPasswordNotSetError} = require('./dataErrors');
const schemas = require('./schemas');

const db = require('./db');
const {aql} = require('arangojs');
const { filterDbFields, flattenBacklogData, flattenBacklogAndRecommendations, flattenFriends, flattenUsersRecommendations} = require('./db/dataManipulation');

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
function checkUserCount(userDataRows, userName){
    //First result or bust
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
@param name the name of the user.
@return <UserObject> Details of the user, as seen in the user schema area
*/
async function getUserInfoByName(name){
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

/*
    A function to validate user login against username+Hash stored in database.
*/
async function validateUserLogin(name, password){
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
        .then(({auth}) => {
            // Fix index with a password hash:
            const index =  auth.findIndex(authData => authData.hash);
            if(index !== -1){
                return auth[0].hash;
            }
            return Promise.reject(new UserPasswordNotSetError(`No password found for ${name}`));
        })
        .then(hash => bcrypt.compare(password, hash));
}

/*
    Function to get a user's backlog (MAL list + backlog data merged and sorted.)
*/
async function getUserBacklog(name){
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

/*
    Function to get a list of recommendations made by the user.
*/
async function getRecommendationsCreatedByUser(name){
    //TODO:

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
        .then(({recs}) => flattenUsersRecommendations(recs))
        .then(data => filterDbFields(data, name));
}

//------------------------------
// Setters
//------------------------------
/*
Function to change a user's password
*/
async function setUserPassword(user, oldPass, newPass){
    return validateUserLogin(user, oldPass).then(res => {
        if(res){
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

//------------------------------
// Creators
//------------------------------
/**
 *
 * @param {Object} userDataObject an object defining a user, as in ../schemas/user/index.schema.json
 */
async function addUser(userDataObject){
    //Check userData is correct format
    const ajvInst = schemas.getAjvInstance();
    const validator = ajvInst.compile(schemas.getSchemaById('user/index.schema.json'));
    if(!validator(userDataObject)){
        throw new TypeError(JSON.stringify(validator.errors));
    }
    //Verify user doesn't already exist:
    if(db.getData().findIndex(x => x.name === userDataObject.name) !== -1){
        throw new NonUniqueUserError(`A user under the name '${userDataObject.name}' already exists in the database.`);
    }
    //Add user to database:
    db.data.push(userDataObject);
    return true;
}

async function addRecommendation(toUsername, fromUsername, showIdentifier, recommendation) {
    //Check user exists
    if (db.getData().findIndex(x => x.name === toUsername) === -1) {
        throw new UserNotFoundError(`User '${toUsername}' not found`);
    }
    //TODO: validate recommendation data

    //Add recommendation (adding show listing if necessary)
    const index = db.getData().findIndex(x => x.name === toUsername);
    const showIdField = typeof showIdentifier === 'number' ? 'malAnimeId' : 'animeName'; //Type of find depends on data type
    let showIndex = db.data[index].backlog.findIndex(show => show[showIdField] === showIdentifier);
    if(showIndex === -1) {
        //Show not on user backlog, so make instance of it:
        db.data[index].backlog.push({
            [showIdField]: showIdentifier
        });
        showIndex = db.data[index].backlog.length -1;   // it now exists on the end :)
    }

    if(!db.data[index].backlog[showIndex].recommendations){
        db.data[index].backlog[showIndex].recommendations = [];
    }

    //TODO: Check if user has already made recommendation and ...(?)

    db.data[index].backlog[showIndex].recommendations.push(recommendation);

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
    validateUserLogin
};
