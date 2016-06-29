/**
 * A convenience class meant to group together insights-related API.
 * All availables methods should be called directly through the
 * {@link IntellogoAPI} object.
 * @mixin
 */
function InsightsAPI () { }

/**
 * Retrieve all insights with metadata.
 * @return {ResponseStream} A stream that emits a 'data' event
 * for each insight. An 'end' event is emitted when there are
 * no more results.
 */
InsightsAPI.prototype.getAllInsights = function () {
    return this.webBridge.get('/api/categories/all', null, true);
};

/**
 * Get metadata for the specified insights.
 * @param {String[]} insights A list of insight IDs.
 * @return {EventEmitter} An event emitter that will emit a single 'data'
 * event with a plain object containing entries in the format
 * <code>&lt;insightId&gt;:&lt;insightMetadata&gt;</code> (one field for each
 * requested insight).
 * An error event is emitted if anything goes wrong.
 */
InsightsAPI.prototype.getInsightsInfo = function (insights) {
    if (!Array.isArray(insights)) {
        insights = [insights];
    }
    var data = this.webBridge.buildPostData(insights, [], false);
    return this.webBridge.post('/api/categories/info',
                               data, {}, false);
};

module.exports = InsightsAPI;
