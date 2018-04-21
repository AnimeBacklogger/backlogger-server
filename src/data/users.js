// Functionality to retreive user information.
// This represents the API for the rest of the system.
// If you swap out backends (mongodb/mysql/postGres/redis) or scrapers, then this is were you change
// code to point to the new access methods.
const bcrypt = require('bcrypt');
const { UserNotFoundError, NonUniqueUserError} = require('./dataErrors');
const schemas = require('./schemas');

const db = require('./db');

const BCRYPT_ROUNDS = Number.parseInt(process.env.BCRYPT_ROUNDS, 10) || 5;

/**
@param name the name of the user.
@return <UserObject> Details of the user, as seen in the user schema area
*/
async function getUserInfoByName(name){
    const data = db.getData().find(user => user.name===name);
    if(!data){
        throw new UserNotFoundError(`User ${name} not found`);
    }
    return data;
}

/*
    A function to validate user login against username+Hash stored in database.
*/
async function validateUserLogin(name, password){
    return getUserInfoByName(name).then(data => bcrypt.compare(password, data.signIn.hash));
}

/*
    Function to get a user's backlog (MAL list + backlog data merged and sorted.)
*/
async function getUserBacklog(name){
    //TODO: scrape from MAL
    //TODO: merge in results from database
    return getUserInfoByName(name).then(x => x.backlog);
}

/*
    Function to get a list of recommendations made by the user.
*/
async function getRecommendationsCreatedByUser(name){
    //TODO:
    return db.getData().reduce((acc, user) => {
        //Check each user's backlog
        user.backlog.forEach(backlogItem => {
            if(backlogItem.recommendations){
                //check each recommendation for whether it was made by user
                backlogItem.recommendations.forEach(rec => {
                    if(rec.name === name || rec.backLoggerName === name){
                        acc.push(rec);
                    }
                });
            }
        });
        return acc;
    }, []);
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
            return bcrypt.hash(newPass, BCRYPT_ROUNDS).then(nHash => {
                //Set new hash:
                const ind =  db.data.findIndex(userData => userData.name === user);
                db.data[ind].signIn.hash = nHash;
                //return true
                return true;
            });
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


//--------------------------------
// Module Exports:
//--------------------------------
module.exports = {
    addUser,
    getRecommendationsCreatedByUser,
    getUserInfoByName,
    getUserBacklog,
    setUserPassword,
    validateUserLogin
};
