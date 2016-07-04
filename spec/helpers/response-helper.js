var EventEmitter = require('events').EventEmitter;

module.exports = {
    IntellogoResponseHelpers: {
        getMockResponseObject: function (shouldStream) {
            var eventEmitter = new EventEmitter();
            eventEmitter.isIntellogoStream = shouldStream;
            return eventEmitter;
        },
        emitDataEvent: function (emitter, data) {
            emitter.emit('data', data);
        },
        emitEndEvent: function (emitter) {
            emitter.emit('end');
        },
        emitErrorEvent: function (emitter, error) {
            emitter.emit('error', error);
        }
    }
};
