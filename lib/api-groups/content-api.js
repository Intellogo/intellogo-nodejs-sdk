/**
 * A convenience class meant to group together content-related API.
 * All availables methods should be called directly through the
 * {@link IntellogoAPI} object.
 * @mixin
 */
function ContentAPI () { }

/**
 * Retrieve specified contents with metadata.
 * @return {ResponseStream} A stream that emits a 'data' event
 * for each resulting content. An 'end' event is emitted when there are
 * no more results.
 */
ContentAPI.prototype.getAllContentsMetadataByContentIds =
    function (contentIds) {
        var data = this.webBridge.buildPostData(contentIds,
                                                null,
                                                false);

        return this.webBridge.post('/api/contents/metadata/all',
                                   data,
                                   null,
                                   true);
    };

/**
 * Retrieves content from the given source that matches the
 * specified criteria.
 * @param {String} source
 * @param {String[]} [sourceIds]
 * @param {String[]} [titles]
 * @return {StreamResponse<Content>}
 */
ContentAPI.prototype.getContentsBySource =
    function (source, sourceIds, titles) {
        var postData = this.webBridge.buildPostData({
            source: source,
            sourceIds: sourceIds,
            titles: titles
        }, null, false);
        return this.webBridge.post('/api/contents/contentsBySource',
                                   postData);
    };


/**
 * Checks whether the IDs for the given source exist.
 * @param {String} source The content's source (e.g. Wikipedia)
 * @param {String[]} ids List of IDs to check.
 * @return {*}
 */
ContentAPI.prototype.checkIfSourceIdsExist = function (ids, source) {
    var postData = this.webBridge.buildPostData({
        source: source,
        sourceIds: ids
    }, null, false);
    return this.webBridge.post('/api/contents/metadata/checkSourceIds',
                               postData);
};

/**
 * Checks whether the title-author pair exists in the Intellogo system
 * @param {String} title
 * @param {String} author
 */
ContentAPI.prototype.checkTitleAndAuthor = function (title, author) {
    var postData = this.webBridge.buildPostData({
        title: title,
        author: author
    }, null, false);
    return this.webBridge.post('/api/contents/metadata/checkTitleAndAuthor',
                               postData,
                               null,
                               false);
};

/**
 * Checks whether a content with the given title and the specified length
 * exists in the Intellogo system. The length will be matched with a
 * +/-10% tolerance, e.g. a content with content length of 2000 will be
 * returned as a match when the <code>length</code> parameter is in the
 * interval [1800; 2200]
 * @param {String} title
 * @param {Number} length
 * @returns {*}
 * No stream response
 */
ContentAPI.prototype.checkIfTitleAndLengthPairExist = function (title, length) {
    var postData = this.webBridge.buildPostData({
        title: title,
        length: length
    }, null, false);
    return this.webBridge.post('/api/contents/metadata/checkTitleAndLength',
                               postData,
                               null,
                               false);
};

module.exports = ContentAPI;
