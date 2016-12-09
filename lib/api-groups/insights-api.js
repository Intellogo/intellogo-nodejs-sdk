var callbackify = require('../util/callbackify').callbackify;

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
InsightsAPI.prototype.create = callbackify(
    function (options) {
        var data = this.webBridge.buildPostData(options);
        return this.webBridge.post('/api/categories/create', data, {}, false);
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

//TODO: finish this, add proper arguments
InsightsAPI.prototype.getInsightSamples = callbackify(
    function (options) {
        var requestData = [{
            categoryId: options.categoryId,
            metadata: true,
            limit: 5,
            fingerprints: true,
            collectionName: 'samples'
        }];

        var data = this.webBridge.buildPostData(requestData, null, false);

        return this.webBridge.post('/api/categories/contents', data, {}, false);
    });

module.exports = InsightsAPI;
