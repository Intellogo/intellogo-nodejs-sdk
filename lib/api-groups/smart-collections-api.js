var callbackify = require('../util/callbackify').callbackify;

/**
 * An item that is a part of a smart collection definition. It must have either `categoryId` or
 * `contentId`
 * @typedef {Object} SmartCollectionsAPI~SmartCollectionItem
 * @property {String} [categoryId] The id of an insight that is part of the collection
 * @property {String} [contentId] The id of a content that is part of the collection
 * @property {Number} min The minimum score (in percents) a content must have
 * in order to be considered a match
 * @property {Number} max The maximum score (in percents) a content must have
 * in order to be considered a match
 */

/**
 * Smart collection metadata
 * @typedef {Object} SmartCollectionsAPI~SmartCollectionMetadata
 * @property {String} name Name
 * @property {String} [displayName] Display name
 * @property {String} [description] A short description of the smart collection
 * @property {String} [image] An image URL associated with this smart collection.
 * <i> Note: in rare cases this property may contain base64-encoded image data instead</i>
 * @property {String[]} tags Tags assigned to this smart collection
 * @property {Number} [modifiedTime] Last modification timestamp
 * @property {Boolean} [productionReady] Whether the smart collection is ready for
 * production
 * @property {Boolean} [autoupdate] Whether recommendations for this smart collection should be
 * automatically regenerated
 * @property {Boolean} [invalidated] System flag, set when the smart collection has been invalidated
 * by another action, e.g. when an associated insight is deleted
 * @property {Boolean} [readonly] Whether the smart collection is read-only
 */

/**
 * An Intellogo Smart collection
 * @typedef {Object} SmartCollectionsAPI~SmartCollection
 * @property {String} [_id] The ID of the smart collection. Only present for existing smart
 * collections. Do not specify when creating a new one, an ID will be automatically assigned and
 * returned by Intellogo.
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
 * @param {Object} [options] Filter smart collections
 * @param {String} [options.categoryId] Only return smart collections that contain
 * an insight with the specified id
 * @param {IntellogoCallback.<SmartCollectionsAPI~SmartCollection[]>} [callback]
 * @return {IntellogoResponse.<SmartCollectionsAPI~SmartCollection>}
 * @method
 */
SmartCollectionsAPI.prototype.getAllSmartCollections = callbackify(
    function (options) {
        return this.webBridge.get('/api/smartFolders', options, true);
    });

/**
 * Get metadata for the specified smart collections.
 * @param {String[]} smartCollections A list of smart collections IDs.
 * @param {IntellogoCallback.<SmartCollectionsAPI~SmartCollection[]>} [callback]
 * @return {IntellogoResponse.<SmartCollectionsAPI~SmartCollection>}
 * @method
 */
SmartCollectionsAPI.prototype.getSmartCollectionsInfo = callbackify(
    function (smartCollections) {
        if (!Array.isArray(smartCollections)) {
            smartCollections = [smartCollections];
        }
        var data = this.webBridge.buildPostData(smartCollections, null, true);
        return this.webBridge.post('/api/smartFolders/info', data, {}, true);

});

/**
 * Create new smart collections with the provided metadata and items.
 * @param {SmartCollectionsAPI~SmartCollection[]} smartCollections A list of smart collections.
 * @param {IntellogoCallback.<IntellogoID[]>} [callback]
 * @return {IntellogoResponse.<IntellogoID>}
 * @method
 */
SmartCollectionsAPI.prototype.createSmartCollections = callbackify(
    function (smartCollections) {
        if (!Array.isArray(smartCollections)) {
            smartCollections = [smartCollections];
        }
        var data = this.webBridge.buildPostData(smartCollections, null, false);
        return this.webBridge.post('/api/smartFolders/create',
                                   data, {}, false);

});

/**
 * Update smart collections with the provided metadata and/or items.
 * @param {SmartCollectionsAPI~SmartCollection[]} smartCollections A list of smart collections.
 * @param {IntellogoCallback.<SuccessResponse[]>} [callback] callback
 * @return {IntellogoResponse.<SuccessResponse>}
 * @method
 */
SmartCollectionsAPI.prototype.updateSmartCollections = callbackify(
    function (smartCollections) {
        if (!Array.isArray(smartCollections)) {
            smartCollections = [smartCollections];
        }
        var data = this.webBridge.buildPostData(smartCollections, null, true);
        return this.webBridge.post('/api/smartFolders/update', data, {}, true);

});

/**
 * Delete an existing smart collection.<br>
 * <br> Unlike other methods in {@link SmartCollectionAPI}, this one does not work on arrays of
 * smart collections. Smart collections can be deleted only one at a time.<br>
 * Note: The callback will be called with no arguments if the delete is successfuly.
 * An error will be passed to the callback if the smart collection does not exist or
 * if it is read-only.
 * @param {String} smartCollectionId The ID of the smart collection to delete.
 * @param {IntellogoCallback.<*>} [callback]
 * @return {IntellogoResponse.<*>}
 * @method
 */
SmartCollectionsAPI.prototype.deleteSmartCollection = callbackify(
    function (smartCollectionId) {
        return this.webBridge.delete('/api/smartFolders/' + smartCollectionId, {}, false);
    });

module.exports = SmartCollectionsAPI;
