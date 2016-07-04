function decorate (fn, decorators) {
    var result = fn;
    decorators.forEach(function (decorator) {
        result = decorator(fn);
    });
    return result;
}

module.exports.mergeFns = function (to, from, decorators) {
    decorators = decorators || [];
    for (var key in from) {
        if (from.hasOwnProperty(key)) {
            to[key] = typeof from[key] === 'function'?
                decorate(from[key], decorators) :
                from[key];
        }
    }
    return to;
};
