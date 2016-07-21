var callbackify = require('../util/callbackify').callbackify;

/**
 * An Intellogo content item.
 * @typedef {Object} ContentAPI~Content
 * @property {String} contentId The ID of the content
 * @property {Object} metadata Metadata relevant to the content.
 * It may contain more keys than the specified here.
 * @property {String} metadata.title
 * @property {String} metadata.author
 * @property {String} metadata.source The origin of the content
 * @property {String|Number} metadata.sourceId The ID of the content
 * that identifies it in its source
 * @property {Number} metadata.ingestionTime The time at which the content was
 * added to the Intellogo system (a timestamp in seconds).
 * @property {String} [metadata.summary]
 * @property {Object} metadata.textStats Contains information about some text
 * characteristics of the content
 * @property {Number} [metadata.textStats.fleschReadingEase]
 * <a src="https://en.wikipedia.org/wiki/Flesch%E2%80%93Kincaid_readability
 * _tests#Flesch_reading_ease">Flesch Reading Ease</a> score of the content
 * @property {Number} [metadata.textStats.avgReadingTime] Average reading
 * time (in seconds)
 * @property {String[]} [metadata.textStats.keywords] Keywords describing the
 * content
 */


/**
 * An object identifying a single content item. A content can be identified
 * either by its <i>contentId</i> or by the pair <i>&lt;source, sourceId&gt;</i>
 * @typedef {Object} ContentAPI~ContentIdentifier
 * @property {String} [contentId] The ID of a content
 * @property {String} [source] The source of the item
 * @property {String|Number} [sourceId] The sourceId
 */

/**
 * @typedef {Object} ContentAPI~TitleExistenceResult
 * @property {boolean} exists
 * @property {ContentAPI~Content[]} existingContents
 */

/**
 * @typedef {Object} ContentAPI~ContentExistenceResult
 * @property {boolean} exists
 * @property {String} contentId
 * @property {String} [source]
 * @property {String} [sourceId]
 */

/**
 * A convenience class meant to group together content-related API.
 * All availables methods should be called directly through the
 * {@link IntellogoClient} object.
 * @mixin
 */
function ContentAPI () { }

/**
 * Retrieve specified contents with metadata.
 * @param {String[]} contentIds The IDs of the content to retrieve
 * @param {IntellogoCallback.<ContentAPI~Content[]>} [callback]
 * @return {IntellogoResponse.<ContentAPI~Content>}
 * @method
 */
ContentAPI.prototype.getAllContentsMetadataByContentIds =
    callbackify (getAllContentsMetadataByContentIds);
function getAllContentsMetadataByContentIds(contentIds) {
    var data = this.webBridge.buildPostData(contentIds,
                                            null,
                                            false);

    return this.webBridge.post('/api/contents/metadata/all',
                               data,
                               null,
                               true);
}

/**
 * Retrieves content from the given source that matches the
 * specified criteria.
 * @param {String} source
 * @param {String[]} [sourceIds]
 * @param {String[]} [titles]
 * @param {IntellogoCallback.<ContentAPI~Content[]>} [callback]
 * @return {IntellogoResponse.<ContentAPI~Content>}
 * @method
 */
ContentAPI.prototype.getContentsBySource = callbackify(
    function (source, sourceIds, titles) {
        var postData = this.webBridge.buildPostData({
            source: source,
            sourceIds: sourceIds,
            titles: titles
        }, null, false);
        return this.webBridge.post('/api/contents/contentsBySource',
                                   postData,
                                   null,
                                   true);
    });

/**
 * Checks whether the IDs for the given source exist.
 * @param {String} source The content's source (e.g. Wikipedia)
 * @param {String[]} ids List of IDs to check.
 * @param {IntellogoCallback.<ContentAPI~ContentExistenceResult[]>} [callback]
 * @return {IntellogoResponse.<ContentAPI~ContentExistenceResult>}
 * @method
 */
ContentAPI.prototype.checkIfSourceIdsExist = callbackify(
    function (ids, source) {
        var postData = this.webBridge.buildPostData({
            source: source,
            sourceIds: ids
        }, null, false);
        return this.webBridge.post('/api/contents/metadata/checkSourceIds',
                                   postData,
                                   null,
                                   true);
    });

/**
 * Checks whether the title-author pair exists in the Intellogo system
 * @param {String} title
 * @param {String} author
 * @param {IntellogoCallback.<ContentAPI~ContentExistenceResult>} [callback]
 * @return {IntellogoResponse.<ContentAPI~ContentExistenceResult>}
 * @method
 */
ContentAPI.prototype.checkTitleAndAuthor = callbackify(
    function (title, author) {
        var postData = this.webBridge.buildPostData({
            title: title,
            author: author
        }, null, false);
        return this.webBridge.post('/api/contents/metadata/checkTitleAndAuthor',
                                   postData,
                                   null,
                                   false);
    });

/**
 * Checks whether a content with the given title and the specified length
 * exists in the Intellogo system. The length will be matched with a
 * +/-10% tolerance, e.g. a content with content length of 2000 will be
 * returned as a match when the <code>length</code> parameter is in the
 * interval [1800; 2200]
 * @param {String} title
 * @param {Number} length
 * @param {IntellogoCallback.<ContentAPI~TitleExistenceResult>} [callback]
 * @return {IntellogoResponse.<ContentAPI~TitleExistenceResult>}
 * @method
 */
ContentAPI.prototype.checkIfTitleAndLengthPairExist = callbackify(
    function (title, length) {
        var postData = this.webBridge.buildPostData({
            title: title,
            length: length
        }, null, false);
        return this.webBridge.post('/api/contents/metadata/checkTitleAndLength',
                                   postData,
                                   null,
                                   false);
    });

module.exports = ContentAPI;
