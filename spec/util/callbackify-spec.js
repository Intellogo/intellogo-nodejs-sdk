var callbackify = require('../../lib/util/callbackify').callbackify;

describe('callbackify', function () {
    var streamResp,
        nonStreamResp,
        input = {data:'data'};

    beforeEach(function () {
        streamResp =
            IntellogoResponseHelpers.getMockResponseObject(true);
        nonStreamResp =
            IntellogoResponseHelpers.getMockResponseObject(false);
    });

    it('should call the function with all passed arguments except the callback',
       function () {
           spyOn(FunctionHelpers, 'streamingFunction').andCallThrough();
           var wrapped = callbackify(FunctionHelpers.streamingFunction);
           expect(wrapped(streamResp, 2, function () {})).toEqual(streamResp);
           expect(FunctionHelpers.streamingFunction)
               .toHaveBeenCalledWith(streamResp, 2);
       });

    it('should call the function with all passed arguments if the last one ' +
       'is not a callback', function () {
           spyOn(FunctionHelpers, 'streamingFunction').andCallThrough();
           var wrapped = callbackify(FunctionHelpers.streamingFunction);

           expect(wrapped(streamResp, 2, 3)).toEqual(streamResp);
           expect(FunctionHelpers.streamingFunction)
               .toHaveBeenCalledWith(streamResp, 2, 3);
       });


    it('should accumulate data from IntellogoResponse stream',
       function (done) {
           var numItemsToEmit = 3,
               wrapped = callbackify(FunctionHelpers.streamingFunction);
           wrapped(streamResp, numItemsToEmit, input, function (error, data) {
               expect(error).toBeFalsy();
               expect(data.length).toEqual(numItemsToEmit);
               done();
           });
       });

    it('should call the callback with an empty array ' +
       'for streaming responses with no data', function (done) {
           var wrapped = callbackify(FunctionHelpers.streamingFunction);
           wrapped(streamResp, 0, input, function (error, data) {
               expect(error).toBeFalsy();
               expect(data).toEqual([]);
               done();
           });
       });

    it('should call the callback with a one-element array for streaming response ' +
       'with one result only', function (done) {
           var wrapped = callbackify(FunctionHelpers.streamingFunction);
           wrapped(streamResp, 1, input, function (error, data) {
               expect(error).toBeFalsy();
               expect(data).toEqual([input]);
               done();
           });
       });

    it('should call the callback with a single object if the response is ' +
       'non-streaming', function (done) {
           var wrapped = callbackify(FunctionHelpers.nonStreamingFunction);
           wrapped(nonStreamResp, input, function (error, data) {
               expect(error).toBeFalsy();
               expect(data).toEqual(input);
               done();
           });
       });

    it('should pass the error to the callback', function (done) {
        var wrapped = callbackify(FunctionHelpers.errorEmittingFunction);
        wrapped(streamResp, function (error, data) {
            expect(error).toEqual(any(Object));
            expect(data).toBeUndefined();
            done();
        });
    });
});
