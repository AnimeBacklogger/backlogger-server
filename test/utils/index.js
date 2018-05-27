const rand = require('./randData');

class Spy {
    constructor(func){
        this.spiedFunc= func;
        this.calledWith=[];
        this.func = this.func.bind(this);
    }

    func(...args){
        this.calledWith.push(args);
        if(this.spiedFunc){
            return typeof this.spiedFunc === 'function' ? this.spiedFunc(...args): this.spiedFunc;
        }
        return void 0;
    }
}

module.exports = {
    Spy,
    rand
};
