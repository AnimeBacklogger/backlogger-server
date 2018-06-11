

const rand = require('./randData');

/**
 * This is a class to wrap a function you wish to spy on. It can either be given a function that will called when it is called, or an immediate return value.
 * As any function given in the constructor will be called for an invocation of the spy.func, if you want to return a function it should be wrapped in a function.
 * @class
 * @property {Array} calledWith Called with is an array of every time the function was called.
 * It bundles args into an array for each entry, so it will be something like: `[ [arg1, arg2], [arg1, arg2], [...]]`
 * @property {Function} func the spied function. Pass this parameter into target, rather than the original function.
 */
class Spy {
    /**
     * @param {*} func If function: This function will be called whenever this.func is called and it's value returned.
     * if non-function: the immediate value is returned whenever this.func is called.
     */
    constructor(func) {
        this.spiedFunc = func;
        this.calledWith = [];
        this.func = this.func.bind(this);
    }

    // eslint-disable-next-line require-jsdoc
    func(...args) {
        this.calledWith.push(args);
        if (this.spiedFunc) {
            return typeof this.spiedFunc === 'function' ? this.spiedFunc(...args) : this.spiedFunc;
        }
        return undefined;
    }
}

module.exports = {
    Spy,
    rand
};
