var mergeFns = require('../../lib/util/merge-fns').mergeFns;

describe('merge-fn', function () {
    var f1 = function () { return 1; },
        f2 = function () { return 2; },
        f3 = function () { return 3; };

    var decorate = function (fn) {
        return function () { return [fn(), fn()]; };
    };
    it('should not modify functions if no decorators are passed',
       function () {
           var source = {
               f1: f1,
               f2: f2
           };
           var dest = {
               f2: f1,
               f3: f3
           };
           mergeFns(dest, source);
           expect(dest.f1).toEqual(source.f1);
           expect(dest.f2).toEqual(source.f2);
           expect(Object.keys(dest).length).toEqual(3);
       });

    it('should only merge functions',
       function () {
           var source = {
               nonFunc: 123
           };
           var dest = {
               nonFunc: 234
           };
           mergeFns(dest, source);
           expect(dest.nonFunc).toEqual(234);
       });

    it('should apply decorators correctly', function () {
        var source = {
            f1: f1
        }, dest = { };
        mergeFns(dest, source, [decorate, decorate]);
        expect(dest.f1()).toEqual([[1, 1], [1, 1]]);
    });
});
