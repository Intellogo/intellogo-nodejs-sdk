var callbackify = require('../util/callbackify').callbackify;

/**
 * Describes a content filter.
 * The commonly used filters are documented below. You can add custom key-value
 * pairs to this object. In that case, the system will try to find content
 * that has exactly matching metadata. Such queries might be slower and/or
 * return no results, so use this feature with caution. <br>
 * <i>Do not specify <b>sources</b> and <b>sourceGroups</b> at the same time
 * - one of them will be overwritten!</i>
 * @typedef {Object} RecommendationsAPI~ContentFilter
 * @property {String[]} [source] - only match content from these sources
 * @property {String[]} [sourceGroup] - only match content from these
 * source groups. Supported source groups are 'wikipedia', 'web', and 'books'
 * @property {Number} [acquisitionDate] - A timestamp (measured in seconds).
 * If specified, only content newer than this will be matched
 */

/**
 * Options that can be passed to the recommendations retrieval methods.
 * Pagination is supported through the from/to parameters.
 * @typedef {Object} RecommendationsAPI~RecommendationsOptions
 * @property {Number} [from=0] Start index of the results
 * @property {Number} [to=30] End index of the results
 * @property {RecommendationsAPI~ContentFilter} [contentFilter={}]
 * Filters to apply to the results
 */

/**
 * @typedef {Object} RecommendationsAPI~Recommendation
 * @property {String} contentId The ID of the recommended content
 * @property {Object} metadata The metadata of the recommended content
 * @property {Number} [score] The score of the content (in the range [0,1])
 */
/**
 * @typedef {Object} RecommendationsAPI~SmartCollectionRecommendation
 * @property {String} contentId The ID of the recommended content
 * @property {Object} metadata The metadata of the recommended content
 * @property {Object.<String,Number>} [scores] The scores of the content
 * (in the range [0,1]) in each of the smart collection's insights
 */

/**
 * @typedef {Object} RecommendationsAPI~ContentRecommendations
 * @property {Object} task Information about the last task that has generated
 * recommendations for the content, if any
 * @property {String} task.taskId The ID of the task
 * @property {TrainingAPI~TaskState} task.status The status of the task
 * @property {RecommendationsAPI~Recommendations[]} ratings
 * The actual recommendations for the content
 */

/**
 * @typedef {Object} RecommendationsAPI~SmartCollectionResult
 * @property {RecommendationsAPI~SmartCollectionRecommendation[]} items
 * The recommended content items
 */
/**
 * A convenience class meant to group together recommendations-related API.
 * All availables methods should be called directly through the
 * {@link IntellogoClient} object.
 * @mixin
 */
function RecommendationsAPI () { }

function applyDefaults (options) {
    return {
        from: options.from || 0,
        to: options.to || 30,
        filter: options.contentFilter && JSON.stringify(options.contentFilter)
    };
}

RecommendationsAPI.prototype = {
    /**
     * Retrieve recommendations for an insight
     * @param {String} insightId the ID of the insight
     * @param {RecommendationsAPI~RecommendationsOptions} options -
     * used to filter the results and to get pagination, if necessary
     * @param {IntellogoCallback.<RecommendationsAPI~Recommendation[]>}
     * [callback]
     * @return {IntellogoResponse.<RecommendationsAPI~Recommendation[]>}
     * @method
     */
    getInsightRecommendations: callbackify(function (insightId, options) {
        var query = applyDefaults(options);
        query.categoryId = insightId;
        query.content = query.filter;
        delete query.filter;

        return this.webBridge.get('/api/rating/categoryBest', query, false);
    }),
    /**
     * Retrieve recommendations for a content
     * @param {String} contentId the ID of the content
     * @param {RecommendationsAPI~RecommendationsOptions} options -
     * used to filter the results and to get pagination, if necessary
     * @param {IntellogoCallback.<RecommendationsAPI~ContentRecommendations>}
     * [callback]
     * @return {IntellogoResponse.<RecommendationsAPI~ContentRecommendations>}
     * @method
     */
    getContentRecommendations: callbackify(function (contentId, options) {
        var query = applyDefaults(options);
        query.contentId = contentId;
        query.contentsToRate = query.filter;
        delete query.filter;

        return this.webBridge.get('/api/rating/contentBest', query, false);
    }),
    /**
     * Retrieve recommendations for the specified smart collection.
     * @param {String} smartCollectionId the ID of the smart collection
     * @param {RecommendationsAPI~RecommendationsOptions} options -
     * used to filter the results and to get pagination, if necessary
     * @param {IntellogoCallback.<RecommendationsAPI~SmartCollectionResult>}
     * [callback]
     * @return
     * {IntellogoResponse.<RecommendationsAPI~SmartCollectionResult>}
     * @method
     */
    getSmartCollectionRecommendations: callbackify(function (smartCollectionId, options) {
        var query = applyDefaults(options);
        query.smartFolderId = smartCollectionId;
        query.metadataFilter = query.filter;
        delete query.filter;

        return this.webBridge.get('/api/rating/smartFolder', query, false);
    }),
    /**
     * Retrieve recommendation for the specified combination of insights.
     * @param {SmartCollectionsAPI~SmartCollectionItem[]} insights
     * @param {RecommendationsAPI~RecommendationsOptions} options -
     * used to filter the results and to get pagination, if necessary
     * @param {IntellogoCallback.<RecommendationsAPI~SmartCollectionResult>}
     * [callback]
     * @return
     * {IntellogoResponse.<RecommendationsAPI~SmartCollectionResult>}
     * @method
     */
    getDynamicCollectionRecommendations: callbackify(function (insights, options) {
        var items = insights.map((insight) =>
                                 JSON.stringify({
                                     categoryId: insight.id,
                                     min: insight.min,
                                     max: insight.max
                                 }));
        var query = applyDefaults(options);
        query.smartFolderItem = items;
        query.metadataFilter = query.filter;
        delete query.filter;

        return this.webBridge.get('/api/rating/smartFolder', query, false);
    })
};

module.exports = RecommendationsAPI;
