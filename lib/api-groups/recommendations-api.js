var _ = require('lodash'),
    callbackify = require('../util/callbackify').callbackify;

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
 * @property {RecommendationsAPI~Recommendations[]} ratings The actual recommendations for
 * the content
 * @property {Object} [task] Information about the last initiated task for this content, if any
 * @property {String} task.taskId The ID of the task
 * @property {TrainingAPI~TaskState} task.status The status of the task
 * @property {Object[]} [lastRated] Information about the last completed tasks for this content.
 * @property {String} lastRated.taskId The ID of the task.
 * @property {TrainingAPI~TaskState} lastRated.status The status of the task.
 * @property {Number} lastRated.timeStarted Timestamp (in ms) when the task was initiated.
 * @property {ContentFilter[]} lastRated.itemsToRate What content filters were used when initiating
 * the given task. If any source groups were specified on task initiation, here they will be in an
 * expanded form (so there will be a list of all sources the source group includes instead of just
 * the name of the source group).
 */

/**
 * @typedef {Object} RecommendationsAPI~SmartCollectionResult
 * @property {RecommendationsAPI~SmartCollectionRecommendation[]} items
 * The recommended content items
 */

/**
 * @typedef {Object} RecommendationsAPI~ContentInsightParams
 * @property {Number} from Start of the results range (used for pagination).
 * @property {Number} to End of the results range (used for pagination).
 * @property {Number} minScore The minimum score of the content against an insight. Insights with
 * lower scores against this content will *not* be returned.
 * @property {Number} maxScore The maximum score of the content against an insight. Insights with
 * higher scores against this content will *not* be returned.
 * @property {Boolean} productionReady Whether to return only production-ready insights.
 */

/**
 * @typedef {Object} RecommendationsAPI~ContentInsightResult
 * @property {InsightsAPI~Insight} category The insight description
 * @property {Number} score The score of the given content against this insight
 */

/**
 * A convenience class meant to group together recommendations-related API.
 * All availables methods should be called directly through the
 * {@link IntellogoClient} object.
 * @mixin
 */
function RecommendationsAPI () { }

RecommendationsAPI.prototype = {
    _applyContentFilterDefaults: function (options) {
        options = options || {};
        var result = {
            from: options.from,
            to: options.to,
            fullMetadata: options.fullMetadata,
            filter: options.contentFilter && JSON.stringify(options.contentFilter)
        };

        return this._cleanObject(result);
    },
    _cleanObject: function (obj) {
        Object.keys(obj).forEach(
            function (key) {
                return ((obj[key] === null) || (obj[key] === undefined)) && delete obj[key];
            });
        return obj;
    },
    /**
     * Retrieve recommendations for an insight
     * @param {String} insightId the ID of the insight
     * @param {ContentRetrievalOptions} options used to filter the results, to get pagination,
     * and/or to disable full metadata retrieval
     * @param {IntellogoCallback.<RecommendationsAPI~Recommendation[]>}
     * [callback]
     * @return {IntellogoResponse.<RecommendationsAPI~Recommendation[]>}
     * @method
     */
    getInsightRecommendations: callbackify(function (insightId, options) {
        var query = this._applyContentFilterDefaults(options);
        query.categoryId = insightId;
        query.content = query.filter;
        delete query.filter;

        return this.webBridge.get('/api/rating/categoryBest', query, false);
    }),
    /**
     * Retrieve recommendations for a user profile.
     * <br>*Note: This method will return results only if
     * the user profile has `autoupdateCategory` set to `true` and a profile update task has
     * finished since the last profile update.*
     * @param {String} profileId the ID of the profile
     * @param {ContentRetrievalOptions} options used to filter the results, to get pagination,
     * and/or to disable full metadata retrieval
     * @param {IntellogoCallback.<RecommendationsAPI~Recommendation[]>}
     * [callback]
     * @return {IntellogoResponse.<RecommendationsAPI~Recommendation[]>}
     * @method
     */
    getProfileRecommendations: callbackify(
        function (profileId, options) {
            var query = this._applyContentFilterDefaults(options);
            query.profileId = profileId;
            query.content = query.filter;
            delete query.filter;

            return this.webBridge.get('/api/rating/profileInsight', query, false);
        }
    ),
    /**
     * Retrieve recommendations for a content
     * @param {String} contentId the ID of the content
     * @param {ContentRetrievalOptions} [recommendatonsOptions] used to filter the results,
     * to get pagination, and/or to disable full metadata retrieval
     * @param {TaskOptions} [taskOptions] Specifies whether to return details for recent
     * task for the same contentId.
     * @param {IntellogoCallback.<RecommendationsAPI~ContentRecommendations>}
     * [callback]
     * @return {IntellogoResponse.<RecommendationsAPI~ContentRecommendations>}
     * @method
     */
    getContentRecommendations: callbackify(
        function (contentId, recommendationsOptions, taskOptions) {
            var query = this._applyContentFilterDefaults(recommendationsOptions);
            query.contentId = contentId;
            query.contentsToRate = query.filter;
            delete query.filter;

            taskOptions = taskOptions || {};
            query.includeLastRated = !!taskOptions.includeLastRated;
            query.includeCurrentTask = taskOptions.includeCurrentTask !== undefined?
                !!taskOptions.includeCurrentTask : true;

            return this.webBridge.get('/api/rating/contentBest', query, false);
        }
    ),
    /**
     * Retrieve recommendations for the specified smart collection.
     * @param {String} smartCollectionId the ID of the smart collection
     * @param {ContentRetrievalOptions} options -
     * used to filter the results and to get pagination, if necessary
     * @param {IntellogoCallback.<RecommendationsAPI~SmartCollectionResult>}
     * [callback]
     * @return
     * {IntellogoResponse.<RecommendationsAPI~SmartCollectionResult>}
     * @method
     */
    getSmartCollectionRecommendations: callbackify(function (smartCollectionId, options) {
        var query = this._applyContentFilterDefaults(options);
        query.smartFolderId = smartCollectionId;
        query.metadataFilter = query.filter;
        delete query.filter;

        return this.webBridge.get('/api/smartFolders/ratings', query, false);
    }),
    /**
     * Retrieve recommendation for the specified combination of insights.
     * @param {SmartCollectionsAPI~SmartCollectionItem[]} insights
     * @param {ContentRetrievalOptions} options -
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
        var query = this._applyContentFilterDefaults(options);
        query.smartFolderItem = items;
        query.metadataFilter = query.filter;
        delete query.filter;

        return this.webBridge.get('/api/smartFolders/ratings', query, false);
    }),
    /**
     * Retrieve all insights for which the given content has a score in the specified range.
     * This can be used to see the most prominent insights for an article. <br>
     * Insights are returned in a sorted order, highest scores first.
     * @param {ContentAPI~ContentIdentifier} contentIdentifier The content for which to return
     * insights
     * @param {RecommendationsAPI~ContentInsightParams} options Options to apply.
     * Supports pagination, score range and a production-ready filter.
     * @param {IntellogoCallback.<RecommendationsAPI~ContentInsightResult[]>} [callback]
     * @return {IntellogoResponse.<RecommendationsAPI~ContentInsightResult[]>}
     * @method
     */
    getInsightsMatchingContent: callbackify(function (contentIdentifier, options) {
        var query = _.merge({}, contentIdentifier, options);
        return this.webBridge.get('/api/rating/contentCategoryRatings', query, false);
    })
};

module.exports = RecommendationsAPI;
