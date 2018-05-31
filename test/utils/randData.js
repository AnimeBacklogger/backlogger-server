'use strict';

/**
 * @param {Integer} max the maximum value of the random integer
 * @returns {Integer} A random integer
 */
function getRandomPositiveInt(max) {
    max = max ? Math.floor(max) : Number.MAX_SAFE_INTEGER;  // eslint-disable-line no-param-reassign
    return Math.floor(Math.random() * max); // The maximum is exclusive and the minimum is inclusive
}

/**
 * @param {Integer} length Number of characters of alphanumeric
 * @returns {String} a string of [a-z0-9] if the length given;
 */
function getRandAlphaNumChars(length = 6) {
    let ret = '';
    while (ret.length < length) {
        ret += Math.random().toString(36).substr(2);
    }

    return ret.substr(0, length);
}

module.exports = {
    getRandomPositiveInt,
    getRandAlphaNumChars
};
