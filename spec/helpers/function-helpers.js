module.exports = {
    FunctionHelpers: {
        streamingFunction: function (resp, numItemsToEmit) {
            process.nextTick(function () {
                for (var i = 0; i < numItemsToEmit; i++) {
                    IntellogoResponseHelpers.emitDataEvent(resp, i);
                }
                IntellogoResponseHelpers.emitEndEvent(resp);
            });
            return resp;
        },
        nonStreamingFunction: function (resp, dataToEmit) {
            process.nextTick(function () {
                IntellogoResponseHelpers.emitDataEvent(dataToEmit);
                IntellogoResponseHelpers.emitEndEvent(resp);
            });
            return resp;
        }
    }
};
