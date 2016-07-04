/**
 * @typedef {Object} InsightsAPI~DynamicGenerationResult
 * @property {boolean} new Whether the returned insight was generated
 * as a result of this operation
 * @property {String[]} categoryIds The id(s) of the matching insights
 * @property {*} [error] Any error that might occur during the operation
 * @property {boolean} success Whether the operation was successful.
 * If this is <code>false</code>, categoryIds won't be set.
 */

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
 * @return {IntellogoResponse} An event emitter that will emit a single 'data'
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

/**
 * Searches for insights that match the specified keyword.
 * If none are found, a new insight will be generated, using the provided
 * generation options.
 * @param {String} keyword The keyword to match
 * @param {Object} [generationOptions]
 * @param {Number} [generationOptions.numContent=30] How many content to
 * use when generating a matching insight
 * @param {String} [generationOptions.displayName] Display name to
 * use for the generated insight
 * @param {String} [generationOptions.description] Description for the
 * generated insight
 * @return {IntellogoResponse.<InsightsAPI~DynamicGenerationResult>}
 */
InsightsAPI.prototype.generateDynamicInsight =
    function (keyword, generationOptions) {
        generationOptions = generationOptions || {};
        var data = {
            searchTerm: keyword,
            numResults: generationOptions.numContent,
            displayName: generationOptions.displayName,
            description: generationOptions.description
        };

        data = this.webBridge.buildPostData(data, [], false);
        return this.webBridge.post('/api/categories/dynamic', data, {}, false);
    };

module.exports = InsightsAPI;
