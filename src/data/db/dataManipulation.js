/**
 * This is a set of data manipulation / reformatting functions for
 * data from the Arango Database
 */

/**
* This function is designed to filter out the database exlusive data, such as _id, _key, _rev
* essentially it recursively searches the given object and removes any keys that start with '_'
* @param {Object} data The data to be filtered
* @returns {Object} a new instance of the data object with the sensitive keys filtered out
*/
function filterDbFields(data) {
    if (data instanceof Array) {
        return data.map(row => filterDbFields(row));
    } else if (typeof data === 'object') {
        return Object.keys(data).reduce((acc, key) => {
            if (!key.startsWith('_')) {
                acc[key] = filterDbFields(data[key]);
            }
            return acc;
        }, {});
    }
    return data;
}

/**
 * 
 * @param {Object} dbShowData the result from the database.
 * @returns {Object} The data mapped into a returnable show object
 */
function mapDbShowToShow(dbShowData){
    const copy = JSON.parse(JSON.stringify(dbShowData));
    // Rename "name" attribute
    copy.animeName = copy.name;
    delete copy.name;

    //return the object
    return filterDbFields(copy);
}

/**
 * Flattens a data set of backlog data, which contains a "show" vertex and a "hasInBacklog" edge.
 * @param {Array} dbShowResults the object returned from a database query
 * @returns {Array} a flattened array of data
 */
function flattenBacklogData(dbShowResults){
    if(!(dbShowResults instanceof Array)){
        throw new TypeError(`Expected show results array, got '${typeof dbShowResults}'(${JSON.stringify(dbShowResults)})`);
    }
    return dbShowResults.map(data => {
        const copy = mapDbShowToShow(data.show);
        if(data.edge.personalScore){
            copy.personalScore = data.edge.personalScore;
        }
        copy.recommendations = [];
        return copy;
    });
}

 /**
  * @param shows {Array}
  * @param recommendations {Array}
  * @returns {Array} A single array containing the superset of shows, with any recommendations attached to the relevant show
  */
function flattenBacklogAndRecommendations(shows, recommendations){
    const flattenedShows = flattenBacklogData(shows);

    const result = recommendations.reduce((showsAcc, rec) => {
        const recommendedShow = rec.show;
        let showIndex = showsAcc.findIndex(showItem => showItem.malAnimeId === recommendedShow.malAnimeId);
        if (showIndex === -1){
            showsAcc.push(mapDbShowToShow(recommendedShow));
            showIndex = showsAcc.length-1;
        }
        //Add recommendation data to the show:
        if (!showsAcc[showIndex].recommendations){
            showsAcc[showIndex].recommendations = [];
        }
        showsAcc[showIndex].recommendations.push(Object.assign({}, rec.user, rec.rec));

        return showsAcc;
    }, flattenedShows);

    // Filter all db fields before returning:
    return filterDbFields(result);
}

/**
 * 
 * @param {Array} dbData the database results
 */
function flattenFriends(dbData){
    return dbData.map(row => {
        return JSON.parse(JSON.stringify({  // to clear any properties with undefined values
            name: row.friendInfo.name,
            malImport: row.edge.malImport
        }));
    });
}

function flattenUsersRecommendations(userReccomendationRows){
    return userReccomendationRows.map(row => {
        return {
            animeName: row.show.name,
            malAnimeId: row.show.malAnimeId,
            score: row.rec.score,
            comment: row.rec.comment,
            to: row.to.name
        }
    });
}

module.exports= {
    filterDbFields,
    flattenBacklogAndRecommendations,
    flattenBacklogData,
    flattenFriends,
    flattenUsersRecommendations
};