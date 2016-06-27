/**
 * A convenience class meant to group together insights-related API.
 * All availables methods should be called directly through the
 * {@link IntellogoAPI} object.
 * @constructor
 */
function InsightsAPI () { }

/**
 * Retrieve all categories with metadata.
 * @return {ResponseStream} A stream that emits a 'data' event
 * for each category. An 'end' event is emitted when there are
 * no more results.
 */
InsightsAPI.prototype.getAllCategories = function () {
    return this.webBridge.get('/api/categories/all', null, true);
};

module.exports = InsightsAPI;
