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
 * A string that describes the possible status for an insights. Possible values
 * are 'new', 'forReview', and 'ready'
 * @typedef {String} InsightsAPI~Status
 */

/**
 * An Intellogo insight
 * @typedef {Object} InsightsAPI~Insight
 * @property {String} categoryId The ID of the insight
 * @property {String} name Name of the insight
 * @property {String} displayName Display name of the insight
 * @property {String} description A short description of the insight
 * @property {String[]} tags Tags assigned to the Insight
 * @property {String[]} keywords Keywords relevant to the insight
 * @property {boolean} productionReady Whether the insight is of
 * production-ready quality
 * @property {boolean} autoupdate Whether auto-update is turned on
 * for the insight
 * @property {boolean} readonly whether the insight is readonly
 * @property {boolean} locked whether the insight is locked for changes
 * @property {Number} modifiedTime The last time an insight was trained
 */

/**
 * A convenience class meant to group together insights-related API.
 * All availables methods should be called directly through the
 * {@link IntellogoClient} object.
 * @mixin
 */
function InsightsAPI () { }

// TODO: add doc
InsightsAPI.prototype.createInsight = callbackify(
    function (options) {
        var data = this.webBridge.buildPostData(options);
        return this.webBridge.post('/api/categories/create', data, {}, false);
    });

// TODO: add doc
InsightsAPI.prototype.updateInsight = callbackify(
    function (options) {
        var data = this.webBridge.buildPostData([options]);
        return this.webBridge.post('/api/categories/update', data, {}, false);
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
 * Get metadata for the specified insights.
 * @param {String[]} insights A list of insight IDs.
 * @param {IntellogoCallback.<Object<String, InsightsAPI~Insight>> [callback]
 * @return {IntellogoResponse.<Object<String, InsightsAPI~Insight>>}
 * @method
 */
InsightsAPI.prototype.getInsightsInfo = callbackify(
    function (insights) {
        if (!Array.isArray(insights)) {
            insights = [insights];
        }
        var data = this.webBridge.buildPostData(insights, [], false);
        return this.webBridge.post('/api/categories/info',
                                   data, {}, false);
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

InsightsAPI.prototype.deleteInsight = callbackify(
    function (id) {
        var data = this.webBridge.buildPostData([id], [], false);
        return this.webBridge.post('/api/categories/delete', data, {}, false);
    }
);


function getInsightSamples(webBridge, insightsOptions, collectionName) {
    const requestData = _.map(insightsOptions,
                              (options) => ({
                                  metadata      : options.metadata || false,
                                  categoryId    : options.categoryId,
                                  collectionName: collectionName
                              }));

    const data = webBridge.buildPostData(requestData, null, false);

    return webBridge.post('/api/categories/contents', data, {}, false);
}

InsightsAPI.prototype.getInsightsSamples = callbackify(
    function (insightsOptions) {
        return getInsightSamples(this.webBridge,
                                 insightsOptions,
                                 'samples');
    }
);

InsightsAPI.prototype.getInsightsTestSamples = callbackify(
    function (insightsOptions) {
        return getInsightSamples(this.webBridge,
                                 insightsOptions,
                                 'testSamples'
        );
    }
);

// TODO: doc
InsightsAPI.prototype.countInsights = callbackify(
    function () {
        return this.webBridge.get('/api/categories/count', {}, false);
    });

module.exports = InsightsAPI;
