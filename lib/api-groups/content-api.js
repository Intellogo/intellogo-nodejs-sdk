/**
 * A convenience class meant to group together content-related API.
 * All availables methods should be called directly through the
 * {@link IntellogoAPI} object.
 * @constructor
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

module.exports = ContentAPI;
