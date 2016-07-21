var callbackify = require('../util/callbackify').callbackify;

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
 * Smart collection metadata
 * @typedef {Object} SmartCollectionsAPI~SmartCollectionMetadata
      "modifiedTime": 1462979480853,
      "tags": [],
      "name": "MathColl4",
      "importance": 0,
      "invalidated": true,
      "image": ""
 * @property {String} name Name
 * @property {String} [displayName] Display name
 * @property {String} [description] A short description of the smart collection
 * @property {String} [image] An image URL associated with this smart collection.
 * <i> Note: in rare cases this property may contain base64-encoded image data instead</i>
 * @property {String[]} tags Tags assigned to this smart collection
 * @property {Number} [modifiedTime] Last modification timestamp
 * @property {Boolean} productionReady Whether the smart collection is ready for
 * production
 * @property {Boolean} [invalidated] Whether the smart collection has been invalidated
 * by another action, e.g. when an associated insight is deleted
 */

/**
 * An Intellogo Smart collection
 * @typedef {Object} SmartCollectionsAPI~SmartCollection
 * @property {String} _id The ID of the smart collection
 * @property {SmartCollectionsAPI~SmartCollectionItem[]} items
 * @property {SmartCollectionsAPI~SmartCollectionMetadata} metadata
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
 * @return {IntellogoResponse.<SmartCollectionsAPI~SmartCollection>}
 * @method
 */
SmartCollectionsAPI.prototype.getAllSmartCollections = callbackify(
    function () {
        return this.webBridge.get('/api/smartFolders', null, true);
    });

/**
 * Get metadata for the specified smart collections.
 * @param {String[]} smartCollections A list of smart collections IDs.
 * @return {IntellogoResponse.<Object<String, SmartCollectionsAPI~SmartCollection>>}
 * @method
 */
SmartCollectionsAPI.prototype.getSmartCollectionsInfo = callbackify(
    function (smartCollections) {
        if (!Array.isArray(smartCollections)) {
            smartCollections = [smartCollections];
        }
        var data = this.webBridge.buildPostData(smartCollections, [], false);
        return this.webBridge.post('/api/smartFolders/info',
                                   data, {}, false);

});

module.exports = SmartCollectionsAPI;
