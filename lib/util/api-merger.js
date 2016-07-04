var mergeFns = require('./merge-fns').mergeFns,
    callbackify = require('./callbackify').callbackify;

function IntellogoApiMerger (base, decorators) {
    this.base = base;
    this.decorators = decorators? decorators: [callbackify];
}

IntellogoApiMerger.prototype.merge = function () {
    for (var i = 0; i < arguments.length; i++) {
        mergeFns(this.base, arguments[i].prototype, this.decorators);
    }
    return this.base;
};

module.exports = IntellogoApiMerger;
