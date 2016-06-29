var events = require('events'),
DEFAULT_POLLING_INTERVAL = 5000;

/**
 * A convenience class meant to group together training-related API.
 * All availables methods should be called directly through the
 * {@link IntellogoAPI} object.
 * @mixin
 */
function TrainingAPI () { }

/**
 * Initiate a training operation with the given parameters
 * @param {String} categoryId The id of the category
 * @param {String} [contentSource] Which sources to rate against
 * @param {Array} [itemsToRate] Which items to rate
 * @return {EventEmitter} Emits a 'data' event with the full server response
 * that contains the task ID of the training task,
 * or 'error' if something goes wrong
 */
TrainingAPI.prototype.initiateTraining = function (categoryId,
                                                   contentSource,
                                                   itemsToRate) {
    var data = {
        categoryId: categoryId
    };
    if (contentSource) {
        data.contentSource = contentSource;
    }
    if (itemsToRate) {
        data.itemsToRate = itemsToRate;
    }

    data = this.webBridge.buildPostData(data, ['categoryId',
                                               'contentSource',
                                               'itemsToRate'],
                                        false);
    return this.webBridge.post('/api/trainings/initiate',
                               data, {}, false);
};

/**
 * Initiate a training operation with the given parameters.
 * You must provide either a <code>contentId</code>, or <b>both</b>
 * <code>source</code> and <code>sourceId</code>. If both are provided,
 * the <code>contentId</code> parameter takes precedence.
 * @param {String} contentId The ID of the content
 * @param {String} source The source of the content
 * @param {String} sourceId The sourceId of the content
 * @return {EventEmitter} Emits a 'data' event with the full server response
 * that contains the task ID of the training task,
 * or 'error' if something goes wrong
 */
TrainingAPI.prototype.contentBest = function (contentId, source,
                                              sourceId) {
    var data = { };
    if (contentId) {
        data.contentId = contentId;
    } else {
        data.content = {
            source: source,
            sourceId: sourceId
        };
    }

    data = this.webBridge.buildPostData(data, null, false);

    return this.webBridge.post('/api/rating/contentBest',
                               data, null, false);
};

/**
 * Retrieve task status
 * @param {String} taskId The task ID
 * @return {EventEmitter} Emits a 'data' event with the full server response
 * representing the task status, or 'error' if something goes wrong
 */
TrainingAPI.prototype.getTaskStatus = function (taskId) {
    var query = { taskId: taskId };
    return this.webBridge.get('/api/trainings/taskStatus', query, false);
};

/**
 * Initiate polling for the specified taskId. This will periodically
 * check the status of the task and emit a result event only when the task
 * transitions to a final state (finished / cancelled / failed).
 * @param {String} taskId The ID of the task to poll for.
 * @param {Number} [pollingIntervalMs] What time interval to use for
 * polling. The default value is 5000ms
 * @return {EventEmitter} An EventEmitter that emits a data event when the
 * task completes successfully. If the task fails or another error occurs,
 * an 'error' event will be emitted.
 */
TrainingAPI.prototype.pollTaskStatus = function (taskId, pollingIntervalMs) {
    var result = new events.EventEmitter(),
        that = this;

    function pollTaskStatus () {
        var pollResponse = that.getTaskStatus(taskId);
        pollResponse.on('data', function (data) {
            if (data.status === 'finished') {
                console.log('Task: ' + taskId + ' has finished !');
                result.emit('data', { state: data.status });
            } else if (data.status === 'cancelled' ||
                       data.status === 'failed') {
                result.emit('error', {state: data.status});
            } else {
                setTimeout(pollTaskStatus, pollingIntervalMs);
            }
        });
        pollResponse.on('error', result.emit.bind(result, 'error'));
    }

    pollingIntervalMs = pollingIntervalMs || DEFAULT_POLLING_INTERVAL;
    pollTaskStatus();

    return result;
};

module.exports = TrainingAPI;
