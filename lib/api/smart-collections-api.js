/**
 * A convenience class meant to group together smart-collections-related API.
 * All availables methods should be called directly through the
 * {@link IntellogoAPI} object.
 * @constructor
 */
function SmartCollectionsAPI () { }

SmartCollectionsAPI.prototype.getAllSmartFolders = function () {
    return this.webBridge.get('/api/smartFolders', null, true);
};

module.exports = SmartCollectionsAPI;
