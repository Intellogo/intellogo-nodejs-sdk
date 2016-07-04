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
 * A convenience class meant to group together smart-collections-related API.
 * All availables methods should be called directly through the
 * {@link IntellogoAPI} object.
 * @mixin
 */
function SmartCollectionsAPI () { }

/**
 * Retrieve all smart collections with their metadata and definitions.
 * @return {ResponseStream} A stream that emits a 'data' event for each
 * smart collection. An 'end' event is emitted when there are
 * no more results.
 */
SmartCollectionsAPI.prototype.getAllSmartCollections = function () {
    return this.webBridge.get('/api/smartFolders', null, true);
};

/**
 * Get metadata for the specified smart collections.
 * @param {String[]} smartCollections A list of smart collections IDs.
 * @return {EventEmitter} An event emitter that will emit a single 'data'
 * event with a plain object containing entries in the format
 * <code>&lt;smartCollectionId&gt;:&lt;smartCollectionMetadata&gt;</code>
 *  (one field for each requested insight).
 * An error event is emitted if anything goes wrong.
 */
SmartCollectionsAPI.prototype.getSmartCollectionsInfo =
    function (smartCollections) {
        if (!Array.isArray(smartCollections)) {
            smartCollections = [smartCollections];
        }
        var data = this.webBridge.buildPostData(smartCollections, [], false);
        return this.webBridge.post('/api/smartFolders/info',
                                   data, {}, false);

};

module.exports = SmartCollectionsAPI;
