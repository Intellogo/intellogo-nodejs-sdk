var callbackify = require('../util/callbackify').callbackify;

/**
 * Content Metadata. It may contain more keys than the specified here.
 * @typedef {Object} ContentAPI~ContentMetadata
 * @property {String} title
 * @property {String} author
 * @property {String} source The origin of the content
 * @property {String|Number} sourceId The ID of the content
 * that identifies it in its source
 * @property {Number} ingestionTime The time at which the content was
 * added to the Intellogo system (a timestamp in seconds).
 * @property {String} [summary]
 * @property {Object} textStats Contains information about some text
 * characteristics of the content
 * @property {Number} [textStats.fleschReadingEase]
 * <a src="https://en.wikipedia.org/wiki/Flesch%E2%80%93Kincaid_readability
 * _tests#Flesch_reading_ease">Flesch Reading Ease</a> score of the content
 * @property {Number} [textStats.avgReadingTime] Average reading
 * time (in seconds)
 * @property {String[]} [textStats.keywords] Keywords describing the
 * content
 * @property {Object[]} [textStats.namedEntities] Named entities in the content
 * that reference DBPedia resources
 * @property {String} textStats.namedEntities.entity The text that matched a resource
 * @property {String} textStats.namedEntities.uri The DBPedia URI of the resource
 * @property {String[]} textStats.namedEntities.types Entity type (e.g. Person, Place)
 */

/**
 * An Intellogo content item.
 * @typedef {Object} ContentAPI~Content
 * @property {String} contentId The ID of the content
 * @property {ContentAPI~ContentMetadata} metadata Metadata relevant to the content.
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
 * Retrieve content by id without metadata
 * @param {String} id The ID of the content to retrieve
 * @param {IntellogoCallback.<ContentAPI~Content>} [callback]
 * @return {IntellogoResponse.<ContentAPI~Content>}
 * @method
 */
ContentAPI.prototype.getContentById = callbackify(
    function (id) {
        return this.webBridge.get('/api/contents/id/' + id, {}, false);
    });

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
    contentIds = contentIds.map(function (contentId) {
        return {contentId: contentId};
    });
    var data = this.webBridge.buildPostData(contentIds,
                                            null,
                                            false);

    return this.webBridge.post('/api/contents/metadata/all',
                               data,
                               null,
                               true);
}

/**
 * Retrieve all content items matching specified criteria.
 * @param {String} searchTerm A search word or expression that the content must match
 * @param {ContentRetrievalOptions} [options] A filter to apply to the results.
 * Also supports pagination.
 * @param {IntellogoCallback.<ContentAPI~Content[]>} [callback]
 * @return {IntellogoResponse.<ContentAPI~Content>}
 * @method
 */
ContentAPI.prototype.searchContent = callbackify(searchContent);
function searchContent (searchTerm, options) {
    var query = { };
    if (searchTerm) {
        query.search = searchTerm;
    }
    options = this._applyContentFilterDefaults(options);
    query.from = options.from;
    query.to = options.to;
    query.metadataFilter = options.filter;

    this._cleanObject(query);
    return this.webBridge.get('/api/contents/all', query, true);
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

ContentAPI.prototype.findDuplicates = callbackify(
    function (metadata) {
        var fields = [
            'source', 'sourceId',
            'title', 'author',
            'length'
        ], postData = this.webBridge.buildPostData(metadata, fields, false);

        return this.webBridge.post('/api/contents/metadata/findDuplicates',
                                   postData,
                                   null,
                                   false);
    });

module.exports = ContentAPI;
