var ApiMerger = require('../../lib/util/api-merger'),
    callbackify = require('../../lib/util/callbackify').callbackify;

describe('Intellogo API Merger', function () {
    it('should merge all passed objects', function () {
        var dest = {};
        var source1 = {
            prototype: {
                f1: function () { return 1; }
            }
        },
        source2 = {
            prototype: {
                f2: function () { return 2; }
            }
        };
        var merger = new ApiMerger(dest, []);
        merger.merge(source1, source2);
        expect(dest.f1).toEqual(any(Function));
        expect(dest.f2).toEqual(any(Function));
        expect(dest.f1()).toEqual(1);
        expect(dest.f2()).toEqual(2);
    });

    it('should apply callbackify to all merged functions', function () {
        var dest = {};
        var source1 = {
            prototype: {
                f1: function () { return 1; }
            }
        },
        source2 = {
            prototype: {
                f2: function () { return 2; }
            }
        };
        var callbacker = {
            callbackify: callbackify
        };
        spyOn(callbacker, 'callbackify').andCallThrough();
        var merger = new ApiMerger(dest, [callbacker.callbackify]);
        merger.merge(source1, source2);
        expect(dest.f1).toEqual(any(Function));
        expect(dest.f2).toEqual(any(Function));
        expect(callbacker.callbackify.callCount).toEqual(2);
    });
});
