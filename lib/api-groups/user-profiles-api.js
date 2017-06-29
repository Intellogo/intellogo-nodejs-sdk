var _ = require('lodash'),
    callbackify = require('../util/callbackify').callbackify;

/**
 * @typedef {Object} UserProfilesAPI~UserProfile
 * @property {String} _id The ID of the user profile
 * @property {String} clientReference A descriptive name of the profile
 * @property {String} [categoryId] The insight ID of the insight generated from this profile.
 * Can be used to get recommendations for the profile.
 * @property {Boolean} autoupdateCategory Whether the profile insight should be auto-updated
 * (i.e. should content recommendations be updated regularly)
 * @property {Boolean} autoupdateCombinations Whether the relevant smart collections for the
 * profile should be auto-updated
 */

/**
 * A content that is a part of a user profile.
 * Differs from {@link ContentAPI~Content} only by the name of the property containing the
 * content's ID.
 * @typedef {Object} UserProfilesAPI~ProfileContent
 * @property {String} _id The ID of the content
 * @property {ContentAPI~ContentMetadata} metadata Metadata relevant to the content.
 */

/**
 * @typedef {Object} UserProfilesAPI~ContentRetrievalOptions
 * @property {Number} from Start of range. Use for pagination of results.
 * @property {Number} to End of range. Use for pagination of results.
 * @param {Boolean} metadata Whether to return the metadata for the profile's content (e.g. title),
 * or just the profile content ids.
 */

/**
 * A convenience class meant to group together user profiles-related API.
 * All availables methods should be called directly through the
 * {@link IntellogoClient} object.
 * @mixin
 */
function UserProfilesAPI() {}

/**
 * Return all available user profiles. The actual content from the profiles will *not* be returned.
 * @param {IntellogoCallback.<UserProfilesAPI~UserProfile[]>} [callback]
 * @return {IntellogoResponse.<UserProfilesAPI~UserProfile>}
 * @method
 */
UserProfilesAPI.prototype.getAllUserProfiles = callbackify(
    function () {
        return this.webBridge.get('/api/profiles/all', {}, true);
    }
);

/**
 * Retrieve metadata for a specific user profile.
 * @param {String} profileId ID of the profile
 * @param {IntellogoCallback.<UserProfilesAPI~UserProfile>} [callback]
 * @return {IntellogoResponse.<UserProfilesAPI~UserProfile>}
 * @method
 */
UserProfilesAPI.prototype.getUserProfileMetadata = callbackify(
    function(profileId) {
        return this.webBridge.get('/api/profiles/metadata', {profileId: profileId}, false);
    }
);

/**
 * Retrieves the content from a reading profile, sorted in ascending order by title.
 * Supports pagination and optional full metadata for the content.<br>
 * If `options.metadata` is false, only the IDs of the profile contents will be returned (as
 * strings). Otherwise, {@link UserProfilesAPI~ProfileContent} objects with full metadata will be
 * returned.
 * @param {String} profileId The ID of the profile.
 * @param {UserProfilesAPI~ContentRetrievalOptions} [options] Content retrieval options
 * @param {IntellogoCallback.<Array<UserProfilesAPI~ProfileContent | String>>} [callback]
 * @return {IntellogoResponse.<UserProfilesAPI~ProfileContent | String>}
 * @method
 */
UserProfilesAPI.prototype.getUserProfileContent = callbackify(
    function (profileId, options) {
        var query = _.merge({
            profileId: profileId
        }, options);

        return this.webBridge.get('/api/profiles/contents', query, true);
    }
);

/**
 * Return the total number of content in the user profile's definition.
 * @param {String} profileId The ID of the profile.
 * @param {IntellogoCallback<Number>} [callback]
 * @return {IntellogoResponse<Number>}
 * @method
 */
UserProfilesAPI.prototype.getUserProfileSize = callbackify(
    function (profileId) {
        return this.webBridge.get('/api/profiles/contentsCount', {profileId: profileId}, false);
    }
);

module.exports = UserProfilesAPI;
