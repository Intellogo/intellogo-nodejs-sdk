module.exports = {
    FunctionHelpers: {
        streamingFunction: function (resp, numItemsToEmit, itemToEmit) {
            process.nextTick(function () {
                for (var i = 0; i < numItemsToEmit; i++) {
                    IntellogoResponseHelpers.emitDataEvent(resp, itemToEmit);
                }
                IntellogoResponseHelpers.emitEndEvent(resp);
            });
            return resp;
        },
        nonStreamingFunction: function (resp, dataToEmit) {
            process.nextTick(function () {
                if (dataToEmit) {
                    IntellogoResponseHelpers.emitDataEvent(resp, dataToEmit);
                }
                IntellogoResponseHelpers.emitEndEvent(resp);
            });
            return resp;
        },
        errorEmittingFunction: function (resp) {
            process.nextTick(function () {
                IntellogoResponseHelpers.emitErrorEvent(resp, {error: 'error'});
            });
            return resp;
        }
    }
};
