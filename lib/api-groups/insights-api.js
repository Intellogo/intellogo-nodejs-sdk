'use strict';
const callbackify = require('../util/callbackify').callbackify,
      _ = require('lodash');

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
 * @typedef {Object} InsightsAPI~SamplesRetrievalOptions
 * @property {String} categoryId The id of the matching insights
 * @property {boolean} [metadata=false] Whether the returned content samples should be populated
 * with their metadata
 */

/**
 * @typedef {Object} InsightsAPI~InsightSample
 * @property {String} contentId The ID of the content
 * @property {boolean} positive If the sample is positive or negative
 * @property {ContentAPI~ContentMetadata} [metadata] Only available after method calls that
 * explicitly populate it. Should not be specified when creating or updating insights
 */

/**
 * @typedef {Object} InsightsAPI~SamplesUpdate
 * @property {string} categoryId Id of the insight
 * @property {Array.<InsightsAPI~InsightSample>} samples
 * @property {Array.<InsightsAPI~InsightSample>} testSamples
 */

/**
 * A string that describes the possible status for an insights. Possible values
 * are 'new', 'forReview', and 'ready'
 * @typedef {String} InsightsAPI~Status
 */

/**
 * An Intellogo insight
 * @typedef {Object} InsightsAPI~Insight
 * @property {String} categoryId The ID of the insight
 * @property {String} name Name of the insight
 * @property {String} [displayName] Display name of the insight
 * @property {String} [description] A short description of the insight
 * @property {String[]} [tags] Tags assigned to the Insight
 * @property {String[]} [keywords] Keywords relevant to the insight
 * @property {boolean} [productionReady] Whether the insight is of
 * production-ready quality
 * @property {boolean} [autoupdate] Whether auto-update is turned on
 * for the insight
 * @property {boolean} [readonly] whether the insight is readonly
 * @property {boolean} [locked] whether the insight is locked for changes
 * @property {Number} modifiedTime The last time an insight was trained
 * @property {boolean} [useTSVD] System flag controlling one of the training parameters of insights
 * with a small number of samples.
 * @property {boolean} [userTrained] System flag marking the insight as dynamically created
 * by a user.
 */

/**
 * New Insight
 * @typedef {Object} InsightsAPI~NewInsight
 * @property {String} name Name of the insight
 * @property {String} [displayName] Display name of the insight
 * @property {String} [description] A short description of the insight
 * @property {String[]} [tags] Tags assigned to the Insight
 * @property {String[]} [keywords] Keywords relevant to the insight
 * @property {boolean} [productionReady] Whether the insight is of
 * production-ready quality
 * @property {boolean} [autoupdate] Whether auto-update is turned on
 * for the insight
 * @property {boolean} [readonly] whether the insight is readonly
 * @property {boolean} [locked] whether the insight is locked for changes
 * @property {Number} modifiedTime The last time an insight was trained
 * @property {boolean} [useTSVD] System flag controlling one of the training parameters of insights
 * with a small number of samples.
 * @property {boolean} [userTrained] System flag marking the insight as dynamically created
 * by a user.
 * @property {Array.<InsightsAPI~InsightSample>} [samples] Samples to assign to the new insight
 * @property {Array.<InsightsAPI~InsightSample>} [testSamples] Test samples to assign to the new
 * insight
 */


/**
 * Insight with samples
 * @typedef {Object} InsightsAPI~InsightWithSamples
 * @property {String} _id The ID of the newly created insight
 * @property {String} name Name of the insight
 * @property {String} [displayName] Display name of the insight
 * @property {String} [description] A short description of the insight
 * @property {String[]} [tags] Tags assigned to the Insight
 * @property {String[]} [keywords] Keywords relevant to the insight
 * @property {boolean} [productionReady] Whether the insight is of
 * production-ready quality
 * @property {boolean} [autoupdate] Whether auto-update is turned on
 * for the insight
 * @property {boolean} [readonly] whether the insight is readonly
 * @property {boolean} [locked] whether the insight is locked for changes
 * @property {Number} modifiedTime The last time an insight was trained
 * @property {boolean} [useTSVD] System flag controlling one of the training parameters of insights
 * with a small number of samples.
 * @property {boolean} [userTrained] System flag marking the insight as dynamically created
 * by a user.
 * @property {Array.<InsightsAPI~InsightSample>} [samples] Samples to assign to the new insight
 * @property {Array.<InsightsAPI~InsightSample>} [testSamples] Test samples to assign to the new
 * insight
 */

/**
 * A convenience class meant to group together insights-related API.
 * All availables methods should be called directly through the
 * {@link IntellogoClient} object.
 * @mixin
 */
function InsightsAPI () { }

/**
 * Create new insights.
 *
 * @param {Array.<InsightsAPI~NewInsight>} insights Array of insights objects
 * @param {IntellogoCallback.<InsightsAPI~InsightWithSamples[]>} [callback]
 * @return {IntellogoResponse.<InsightsAPI~InsightWithSamples>}
 * @method
 */
InsightsAPI.prototype.createInsights = callbackify(
    function (insights) {
        var data = this.webBridge.buildPostData(insights, null, true);
        return this.webBridge.post('/api/categories/create', data, {}, true);
    });

/**
 * Update insights' metadata.
 * Note that samples and testSamples are not updated by this call.
 * Use {@link InsightsAPI#setInsightsSamples}, {@link InsightsAPI#assignInsightsSamples},
 * or {@link InsightsAPI#unassignInsightsSamples} for them instead.
 *
 * @param {Array.<InsightsAPI~Insight>} insights Array of insights objects
 * @param {IntellogoCallback.<SuccessResponse[]>} [callback]
 * @return {IntellogoResponse.<SuccessResponse>}
 * @method
 */
InsightsAPI.prototype.updateInsights = callbackify(
    function (insights) {
        var data = this.webBridge.buildPostData(insights, null, true);
        return this.webBridge.post('/api/categories/update', data, {}, true);
    });

/**
 * Retrieve all insights with metadata.
 * @param {String} [searchTerm] A search term used to filter the returned
 * insights. If specified, only insights relevant to that term will be returned.
 * @param {InsightsAPI~Status[]} [status] The desired status of the insights.
 * @param {IntellogoCallback.<InsightsAPI~Insight[]>} [callback]
 * @return {IntellogoResponse.<InsightsAPI~Insight>}
 * @method
 */
InsightsAPI.prototype.getAllInsights = callbackify(
    function (searchTerm, status) {
        var query = {
            search: searchTerm,
            status: status && JSON.stringify(
                Array.isArray(status)? status : [status])
        };
        return this.webBridge.get('/api/categories/all', query, true);
    });

/**
 * Return the number of all insights.
 *
 * @param {IntellogoCallback.<Number>} [callback]
 * @return {IntellogoResponse.<Number>}
 * @method
 */
InsightsAPI.prototype.countInsights = callbackify(
    function () {
        return this.webBridge.get('/api/categories/count', {}, false);
    });

/**
 * Get metadata for the specified insights.
 * @param {String[]} insights A list of insight IDs.
 * @param {IntellogoCallback.<Object<String, InsightsAPI~Insight>>} [callback]
 * @return {IntellogoResponse.<Object<String, InsightsAPI~Insight>>}
 * @method
 */
InsightsAPI.prototype.getInsightsInfo = callbackify(
    function (insights) {
        if (!Array.isArray(insights)) {
            insights = [insights];
        }
        var data = this.webBridge.buildPostData(insights, null, false);
        return this.webBridge.post('/api/categories/info', data, {}, false);
    });

/**
 * Get image URLs associated with the insight's positive samples. This can be used to display
 * representative images of an insight.
 * @param {String} insightId The ID of the insight for which to retrieve the image URLs
 * @param {Number} [imageCount] Maximum number of URLs to return
 * @param {IntellogoCallback.<String[]>} [callback]
 * @return {IntellogoResponse.<String>}
 * @method
 */
InsightsAPI.prototype.getInsightImages = callbackify(
    function (insightId, imageCount) {
        var query = {
            id: insightId
        };
        if (imageCount) {
            query.count = imageCount;
        }
        return this.webBridge.get('/api/categories/contentImages', query, true);
    });

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
 * @param {IntellogoCallback.<InsightsAPI~DynamicGenerationResult>} [callback]
 * @return {IntellogoResponse.<InsightsAPI~DynamicGenerationResult>}
 * @method
 */
InsightsAPI.prototype.generateDynamicInsight = callbackify(
    function (keyword, generationOptions) {
        generationOptions = generationOptions || {};
        var data = {
            searchTerm: keyword,
            numResults: generationOptions.numContent,
            displayName: generationOptions.displayName,
            description: generationOptions.description
        };

        data = this.webBridge.buildPostData(data, null, false);
        return this.webBridge.post('/api/categories/dynamic', data, {}, false);
    });

/**
 * Deletes a list of existing insights.
 * @param {String[]} ids Ids of the insights to be deleted
 * @param {IntellogoCallback.<SuccessResponse[]>} [callback]
 * @return {IntellogoResponse.<SuccessResponse>}
 * @method
 */
InsightsAPI.prototype.deleteInsights = callbackify(
    function (ids) {
        var data = this.webBridge.buildPostData(ids, null, true);
        return this.webBridge.post('/api/categories/delete', data, {}, true);
    }
);


function getInsightSamples(webBridge, insightsOptions, collectionName) {
    const requestData = _.map(insightsOptions,
                              (options) => ({
                                  metadata      : options.metadata || false,
                                  categoryId    : options.categoryId,
                                  collectionName: collectionName
                              }));

    const data = webBridge.buildPostData(requestData, null, true);

    return webBridge.post('/api/categories/contents', data, {}, true);
}

/**
 * Populate the insights' samples.
 *
 * @param {Array.<InsightsAPI~SamplesRetrievalOptions>} insights
 * @param {IntellogoCallback.<InsightsAPI~InsightWithSamples[]>} [callback]
 * @return {IntellogoResponse.<InsightsAPI~InsightWithSamples>}
 * @method
 */
InsightsAPI.prototype.getInsightsSamples = callbackify(
    function (insights) {
        return getInsightSamples(this.webBridge, insights, 'samples');
    }
);

/**
 * Populate the insights' test samples.
 *
 * @param {Array.<InsightsAPI~SamplesRetrievalOptions>} insights
 * @param {IntellogoCallback.<InsightsAPI~InsightWithSamples[]>} [callback]
 * @return {IntellogoResponse.<InsightsAPI~InsightWithSamples>}
 * @method
 */
InsightsAPI.prototype.getInsightsTestSamples = callbackify(
    function (insights) {
        return getInsightSamples(this.webBridge, insights, 'testSamples');
    }
);

/**
 * Replace the samples or testSamples of insight object. Previously assigned samples will be
 * overwritten.
 *
 * @param {Array.<InsightsAPI~SamplesUpdate>} insightsWithSamples
 * @param {IntellogoCallback.<InsightsAPI~InsightWithSamples[]>} [callback]
 * @return {IntellogoResponse.<InsightsAPI~InsightWithSamples>}
 * @method
 */
InsightsAPI.prototype.setInsightsSamples = callbackify(
    function (insightsWithSamples) {
        let requestData = _.map(insightsWithSamples,
            (option) => {
                return {
                    categoryId: option.categoryId,
                    samples: option.samples,
                    testSamples: option.testSamples
                };
            }
        );

        let data = this.webBridge.buildPostData(requestData, null, true);

        return this.webBridge.post('/api/categories/samples/update', data, {}, true);
    }
);

/**
 * Assign new samples or testSamples to an insight. Previously assigned samples will remain
 * assigned to the insight. <br>
 * To unassign samples, either use {@link InsightsAPI#unassignInsightsSamples}, or replace all
 * insight samples with {@link InsightsAPI#setInsightsSamples}<br>
 * @param {Array.<InsightsAPI~SamplesUpdate>} insightsWithSamples
 * @param {IntellogoCallback.<SuccessResponse[]>} [callback]
 * @return {IntellogoResponse.<SuccessResponse>}
 * @method
 */
InsightsAPI.prototype.assignInsightsSamples = callbackify(
    function (insightsWithSamples) {
        var data = this.webBridge.buildPostData(insightsWithSamples, null, true);
        return this.webBridge.post('/api/categories/assign', data, {}, true);
    });


/**
 * Unassign samples or testSamples from an insight.
 * @param {Array.<InsightsAPI~SamplesUpdate>} insightsWithSamples
 * @param {IntellogoCallback.<SuccessResponse[]>} [callback]
 * @return {IntellogoResponse.<SuccessResponse>}
 * @method
 */
InsightsAPI.prototype.unassignInsightsSamples = callbackify(
    function (insightsWithSamples) {
        var data = this.webBridge.buildPostData(insightsWithSamples, null, true);
        return this.webBridge.post('/api/categories/unassign', data, {}, true);
    });

module.exports = InsightsAPI;
