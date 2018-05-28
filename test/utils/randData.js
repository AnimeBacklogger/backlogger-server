/**
 * 
 * @param {Integer} max the maximum value of the random integer
 */
function getRandomPositiveInt(max) {
    max = max ? Math.floor(max) : Number.MAX_SAFE_INTEGER;
    return Math.floor(Math.random() * max); //The maximum is exclusive and the minimum is inclusive
}

/**
 * 
 * @param {Integer} length Number of characters of alphanumeric
 */
function getRandAlphaNumChars(length = 6) {
    let ret = '';
    while(ret.length < length){
        ret += Math.random().toString(36).substr(2);
    }

    return ret.substr(0, length);
}

module.exports = {
    getRandomPositiveInt,
    getRandAlphaNumChars
};