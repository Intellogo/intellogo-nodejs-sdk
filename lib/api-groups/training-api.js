var events = require('events'),
    callbackify = require('../util/callbackify').callbackify,
    _ = require('lodash'),
   DEFAULT_POLLING_INTERVAL = 5000;

/**
 * The status of an Intellogo task. The possible values are:
 * 'new', 'waiting', 'running', 'finished', 'failed' and 'cancelled'.
 * @typedef {String} TrainingAPI~TaskState
 */

/**
 * @typedef {Object} TrainingAPI~InsightTask
 * @property {String} taskId The ID of the task
 * @property {String} categoryId The ID of the insight that this task will train
 */

/**
 * @typedef {Object} TrainingAPI~ContentRecommendationTask
 * @property {Object} task Information about the initiated task
 * @property {String} task.taskId The ID of the task
 * @property {TrainingAPI~TaskState} task.status The status of the task
 * @property {Number} task.timeStarted When the task started. Will be -1
 * if the task is still pending
 * @property {String} requestId A requestId that can be used to cancel the task
 * @property {RecommendationsAPI~Recommendation[]} ratings Currently available
 * recommendations for the content for which the task was initiated
 */

/**
 * A description of the status of a task. Contains information about progress
 * and subtasks, if there are any
 * @typedef {Object} TrainingAPI~TaskStatus
 * @property {String} id The ID of the task
 * @property {String} name A human-readable name for the task
 * @property {TrainingAPI~TaskState} status Task state
 * @property {Object[]} subTasks Information about subtasks
 * @property {Number} progress Progress of the task. 1 means the task
 * has finished.
 * @property {Number} timeStarted
 * @property {Number} timeQueued
 * @property {Number} timeFinished
 * @property {Number} timeIdle
 * @property {Number} timeElapsed
 */

/**
 * @typedef {Object} TrainingAPI~TaskWrapperParams
 * @property {String} [idPath=taskId] How to find the taskId from the result
 * of the task initiation. E.g. for content recommendations generation
 * this path is 'task.taskId'.
 * @property {Boolean} [supportsWebhooks] Whether the task initiator accepts
 * a webhook argument. If <code>true</code>, a webhook may be used instead of
 * polling.
 */

/**
 * A convenience class meant to group together training-related API.
 * All availables methods should be called directly through the
 * {@link IntellogoClient} object.
 * @mixin
 */
function TrainingAPI () { }

/**
 * Initiate a training operation with the given parameters
 * @param {String} insightId The id of the insight
 * @param {String[]} [sources] Content from which sources to rate after the
 * insight has been trained
 * @param {ContentAPI~ContentIdentifier[]} [itemsToRate] Specific content items
 * to rate after the insight has been trained
 * @param {IntellogoCallback.<TrainingAPI~InsightTask>} [callback]
 * @returns {IntellogoResponse.<TrainingAPI~InsightTask>}
 * @method
 */
TrainingAPI.prototype.initiateInsightTraining = callbackify(initiateInsightTraining);
function initiateInsightTraining (insightId,
                                  sources,
                                  itemsToRate,
                                  webhook) {
    var data = {
        categoryId: insightId
    };
    var query = {};
    if (sources) {
        data.contentSource = sources;
    }
    if (itemsToRate) {
        data.itemsToRate = itemsToRate;
    }

    if (webhook) {
        query.webhookId = webhook;
    }

    data = this.webBridge.buildPostData(data, ['categoryId',
                                               'contentSource',
                                               'itemsToRate'],
                                        false);
    return this.webBridge.post('/api/trainings/initiate',
                               data, query, false);
}

/**
 * Initiate a task for generating recommendations for the specified content
 * @param {ContentAPI~ContentIdentifier} content The content for which to
 * generate recommendations
 * @param {IntellogoCallback.<TrainingAPI~ContentRecommendationTask>} [callback]
 * @returns {IntellogoResponse.<TrainingAPI~ContentRecommendationTask>}
 * @method
 */
TrainingAPI.prototype.initiateContentRecommendationGeneration =
    callbackify(initiateContentRecommendationGeneration);
function initiateContentRecommendationGeneration (content, webhook) {
    var data = { }, query = { };
    if (content.contentId) {
        data.contentId = content.contentId;
    } else {
        data.content = {
            source: content.source,
            sourceId: content.sourceId
        };
    }
    if (webhook) {
        query.webhookId = webhook;
    }

    data = this.webBridge.buildPostData(data, null, false);

    return this.webBridge.post('/api/rating/contentBest',
                               data, query, false);
}


/**
 * Retrieve task status
 * @param {String} taskId The task ID
 * @param {IntellogoCallback.<TrainingAPI~TaskStatus>} [callback]
 * @returns {IntellogoResponse.<TrainingAPI~TaskStatus>}
 * @method
 */
TrainingAPI.prototype.getTaskStatus = callbackify(getTaskStatus);
function getTaskStatus (taskId) {
    var query = { taskId: taskId };
    return this.webBridge.get('/api/trainings/taskStatus', query, false);
}

/**
 * Initiate polling for the specified taskId. This will periodically
 * check the status of the task and emit a result event only when the task
 * transitions to a final state (finished / cancelled / failed).
 * @param {String} taskId The ID of the task to poll for.
 * @param {Number} [pollingIntervalMs] What time interval to use for
 * polling. The default value is 5000ms
 * @param {IntellogoCallback.<Object>} [callback]
 * @returns {IntellogoResponse.<Object>} Will emit a data event when the
 * task completes successfully. If the task fails or another error occurs,
 * an 'error' event will be emitted.
 * @method
 */
TrainingAPI.prototype.pollTaskStatus = callbackify(pollTaskStatus);
function pollTaskStatus (taskId, pollingIntervalMs) {
    var result = new events.EventEmitter(),
        that = this;

    function pollTaskStatus () {
        var pollResponse = that.getTaskStatus(taskId);
        pollResponse.on('data', function (data) {
            if (data.status === 'finished') {
                result.emit('data', { state: data.status });
                result.emit('end');
            } else if (data.status === 'cancelled' ||
                       data.status === 'failed') {
                result.emit('error', {
                    error: 'Task ended with status ' + data.status,
                    state: data.status
                });
            } else {
                setTimeout(pollTaskStatus, pollingIntervalMs);
            }
        });
        pollResponse.on('error', result.emit.bind(result, 'error'));
    }

    pollingIntervalMs = pollingIntervalMs || DEFAULT_POLLING_INTERVAL;
    pollTaskStatus();

    return result;
}

/**
 * Creates a wrapper around one of the task-initiating methods.
 * When the wrapper is called, it initiates a task using the specified method
 * and the provided arguments. The last argument is expected to be a callback,
 * otherwise an error is thrown.
 * The wrapper then waits for it to finish either by polling, or using a webook
 * if the {@link IntellogoClient} is set up for it.
 * The callback is called when the task has finished or if an error occurs.
 * @param {IntellogoFunction} taskInitiator A method that can initiate a task.
 * It should already be bound to the proper context.
 * @param {TrainingAPI~TaskWrapperParams} executionParams Parameters controlling
 * how the wrapper is set up.
 * @method
 * @private
 */
TrainingAPI.prototype._wrapTaskExecution = function (taskInitiator, executionParams) {
    var that = this;

    function extractTaskId (response, executionParams) {
        var idPath = (executionParams && executionParams.idPath) || 'taskId';
        return _.get(response, idPath);
    }

    return function () {
        var callback = arguments[arguments.length - 1];
        if (typeof callback !== 'function') {
            throw new Error('Expected callback as the last argument!');
        }

        var args = Array.prototype.slice.call(arguments, 0,
                                              arguments.length - 1);

        function initiationCallbackPoll (error, response) {
            if (error) {
                callback(error);
                return;
            }
            var taskId = extractTaskId(response, executionParams);
            if (!taskId) {
                callback(new Error('No taskId found in response!'));
                return;
            }
            that.pollTaskStatus(taskId, callback);
        }

        if (executionParams.webhookSupport && that.webService) {
            var webhook = that.webService.registerWebhook(callback);
            args.push(webhook);
        } else {
            args.push(initiationCallbackPoll);
        }

        taskInitiator.apply(null, args);
    };
};

/**
 * Generate recommendations for an insight. This method initiates an insight
 * training task and waits until the task has completed to call its callback.
 * It accepts the same arguments as {@link TrainingAPI#initiateInsightTraining},
 * except that the last argument must be a callback function.
 * The callback will be called when the task has finished.
 * If a local notifications web service has been initialized (using
 * {@link IntellogoClient#initNotificationsService}, a webhook will be used to
 * signal task completion.
 * Otherwise, regular polling will be used.
 */
TrainingAPI.prototype.generateInsightRecommendations = function () {
    var wrapped = this._wrapTaskExecution(
        this.initiateInsightTraining.bind(this),
        {
            webhookSupport: true
        });
    wrapped.apply(this, arguments);
};

/**
 * Generate recommendations for a content. This method initiates a content task
 * and waits until the task has completed to call its callback.
 * It accepts the same arguments as {@link TrainingAPI#initiateContentRecommendationGeneration}
 * except that the last argument must be a callback function.
 * The callback will be called when the task has finished.
 * If a local notifications web service has been initialized (using
 * {@link IntellogoClient#initNotificationsService}, a webhook will be used to signal
 * task completion.
 * Otherwise, regular polling will be used.
 */
TrainingAPI.prototype.generateContentRecommendations = function () {
    var wrapped = this._wrapTaskExecution(
        this.initiateContentRecommendationGeneration.bind(this),
        {
            webhookSupport: true,
            idPath: 'task.taskId'
        });
    wrapped.apply(this, arguments);
};

module.exports = TrainingAPI;
