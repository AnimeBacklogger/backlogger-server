// Functionality to retreive user information.
// This represents the API for the rest of the system.
// If you swap out backends (mongodb/mysql/postGres/redis) or scrapers, then this is were you change
// code to point to the new access methods.
const bcrypt = require('bcrypt');
const {UserNotFoundError} = require('./dataErrors');

const db = require('./db');

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

//--------------------------------
// Module Exports:
//--------------------------------
module.exports = {
    getUserInfoByName,
    validateUserLogin,
    getUserBacklog,
    getRecommendationsCreatedByUser
};
