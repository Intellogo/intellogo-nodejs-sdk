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
 */

/**
 * An item that is a part of a smart collection definition.
 * @typedef {Object} SmartCollectionsAPI~SmartCollectionItem
 * @property {String} id The id of the insight that is part of the collection
 * @property {Number} min The minimum score (in percents) a content must have
 * in order to be considered a match
 * @property {Number} max The maximum score (in percents) a content must have
 * in order to be considered a match
 */
/**
 * A <code>Stream</code> object that emits a 'data' event for every
 * result object received from the server. An 'end' event is emitted when
 * no more data is available. If an error occurs, an 'error' event is
 * emmited.
 * @typedef {Stream} IntellogoClient~IntellogoResponse
 */
/**
 * A convenience class meant to group together recommendations-related API.
 * All availables methods should be called directly through the
 * {@link IntellogoAPI} object.
 * @mixin
 */
function RecommendationsAPI () { }

RecommendationsAPI.prototype = {
    /**
     * Retrieve recommendations for an insight
     * @param {String} insightId the ID of the insight
     * @param {RecommendationsAPI~RecommendationsOptions} options -
     * use to filter the results and to get pagination, if necessary
     * @return {IntellogoResponse}
     */
    getInsightRecommendations: function (insightId, options) {
        var query = {
            categoryId: insightId,
            from: options.from || 0,
            to: options.to || 30,
            content: options.contentFilter &&
                JSON.stringify(options.contentFilter)
        };
        return this.webBridge.get('/api/rating/categoryBest', query, false);
    },
    /**
     * Retrieve recommendations for a content
     * @param {String} contentId the ID of the content
     * @param {RecommendationsAPI~RecommendationsOptions} options -
     * use to filter the results and to get pagination, if necessary
     * @return {IntellogoResponse}
     */
    getContentRecommendations: function (contentId, options) {
        var query = {
            contentId: contentId,
            from: options.from || 0,
            to: options.to || 30,
            contentsToRate: options.contentFilter &&
                JSON.stringify(options.contentFilter)
        };
        return this.webBridge.get('/api/rating/contentBest', query, false);
    },
    /**
     * Retrieve recommendations for the specified smart collection.
     * @param {String} smartCollectionId the ID of the smart collection
     * @param {RecommendationsAPI~RecommendationsOptions} options -
     * use to filter the results and to get pagination, if necessary
     * @return {IntellogoResponse}
     */
    getSmartCollectionRecommendations: function (smartCollectionId, options) {
        var query = {
            smartFolderId: smartCollectionId,
            from: options.from || 0,
            to: options.to || 30,
            metadataFilter: options.contentFilter &&
                JSON.stringify(options.contentFilter)
        };
        return this.webBridge.get('/api/rating/smartFolder', query, false);
    },
    /**
     * Retrieve recommendation for the specified combination of insights.
     * @param {SmartCollectionItem[]} insights
     */
    getDynamicCollectionRecommendations: function (insights, options) {
        var items = insights.map((insight) =>
                                 JSON.stringify({
                                     categoryId: insight.id,
                                     min: insight.min,
                                     max: insight.max
                                 }));
        var query = {
            smartFolderItem: items,
            from: options.from || 0,
            to: options.to || 30,
            metadataFilter: options.contentFilter &&
                JSON.stringify(options.contentFilter)
        };

        return this.webBridge.get('/api/rating/smartFolder', query, false);
    }
};

module.exports = RecommendationsAPI;
