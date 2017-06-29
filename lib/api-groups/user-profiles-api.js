var _ = require('lodash'),
    events = require('events'),
    callbackify = require('../util/callbackify').callbackify;

/**
 * @typedef {Object} UserProfilesAPI~UserProfile
 * @property {String} _id The ID of the user profile
 * @property {String} clientReference A descriptive name of the profile
 * @property {String} [categoryId] The insight ID of the insight generated from this profile.
 * Can be used to get recommendations for the profile. This field is system-maintained and cannot
 * be changed through the API.
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
 * @property {Boolean} metadata Whether to return the metadata for the profile's content
 * or just the profile content ids.
 */

/**
 * @typedef {Object} UserProfilesAPI~ProfileData
 * @property {String} clientReference A descriptive name of the profile
 * @property {Boolean} autoupdateCategory Whether the profile insight should be auto-updated
 * (i.e. should content recommendations be updated regularly)
 * @property {Boolean} autoupdateCombinations Whether the relevant smart collections for the
 * profile should be auto-updated
 * @property {String[]} contents An array containing all of this profile's content
 */

/**
 * @typedef {Object} UserProfilesAPI~CombinationOptions
 * @property {Number} combinationCategoriesMin The minimum number of insights in a combination
 * (Only combinations containing at least this number of insights will be returned.)
 * @property {Number} combinationCategoriesMax The maximum number of insights in a combination.
 * (Only combinations containing at most this number of insights will be returned.)
 * @property {Number} combinationContentsMinCount The minimum number of content that a combination
 * must match. _Applied only when <code>combinationContentsMinPercent</code> is
 * **NOT** specified._
 * @property {Number} combinationContentsMinPercent Acts like `combinationContentsMinCount`, but
 * instead of setting a number of content, specifies what <b>percentage</b> of the profile's
 * content must be matched by each returned combination
 * @property {String[]} tags Filter returned combinations by tags.<br>
 * A combination matches a tag if at least one of the combination's insights has that tag.<br>
 * Only combinations that match <b>all</b> specified tags will be returned
 * @property {Number} from Start of range. Used for pagination
 * @property {Number} to End of range.Used for pagination
 */

/**
 * @typedef {Object} UserProfilesAPI~ProfileCombination
 * @property {String[]} categories IDs of the insights in this combination
 * @property {String[]} contents IDs of the content that the combination matched. Can be used to
 * understand why the insights in the combination were chosen.
 * @property {String[]} tags The tags of the combination, i.e. the union of the tags of all
 * insights in the combination
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

/**
 * Create a new user profile.
 * @param {UserProfilesAPI~ProfileData} profileData Metadata and content to include in the new
 * user profile
 * @param {IntellogoCallback<UserProfilesAPI~UserProfile>} [callback]
 * @return {IntellogoResponse<UserProfilesAPI~UserProfile>}
 * @method
 */
UserProfilesAPI.prototype.createUserProfile = callbackify(
    function (profileData) {
        var data = this.webBridge.buildPostData([profileData], null, false),
            result = new events.EventEmitter();

        // The REST API only supports bulk profile creation
        // on the original response, the 'data' event will contain a single-element array
        // with the created profile. Listen and reemit a single object instead of the array
        var originalResponse = this.webBridge.post('/api/profiles/create', data, {}, false);
        originalResponse.once('error', result.emit.bind(result, 'error'));
        originalResponse.once('data', function (createdProfiles) {
            result.emit('data', createdProfiles[0]);
        });
        originalResponse.once('end', result.emit.bind(result, 'end'));
        return result;
    }
);

/**
 * Update a user's profile. Missing fields will not be changed.<br>
 * If `profileData.contents` is provided, it will replace all content currently assigned to the
 * profile. If you want to assign additional content, use
 * {@link UserProfilesAPI#assignContentToProfile}
 * @param {String} profileId The ID of the profile to udpate
 * @param {UserProfilesAPI~ProfileData} The updated profile properties.
 * @param {IntellogoCallback<SuccessResponse>} [callback]
 * @return {IntellogoResponse<SuccessResponse>}
 * @method
 */
UserProfilesAPI.prototype.updateUserProfile = callbackify(
    function (profileId, profileData) {
        var data = {
            profileId: profileId,
            profileData: profileData
        };
        data = this.webBridge.buildPostData(data, null, false);

        return this.webBridge.post('/api/profiles/update', data, {}, false);
    }
);

/**
 * Assign new content to the user profile. Previous content will remain unaffected and duplicates
 * will be automatically excluded.
 * @param {String} profileId The ID of the profile to update
 * @param {String[]} contentsToAssign The IDs of the new content to assign
 * @param {IntellogoCallback<SuccessResponse>} [callback]
 * @return {IntellogoResponse<SuccessResponse>}
 * @method
 */
UserProfilesAPI.prototype.assignContentToUserProfile = callbackify(
    function (profileId, contentsToAssign) {
        var data = {
            profileId: profileId,
            contentIds: contentsToAssign
        };
        data = this.webBridge.buildPostData(data, null, false);

        return this.webBridge.post('/api/profiles/assignContents', data, {}, false);
    }
);

/**
 * Remove content from the user profile.
 * @param {String} profileId The ID of the profile to update
 * @param {String[]} contentsToUnassign The IDs of the content to remove from the profile
 * @param {IntellogoCallback<SuccessResponse>} [callback]
 * @return {IntellogoResponse<SuccessResponse>}
 * @method
 */
UserProfilesAPI.prototype.unassignContentFromUserProfile = callbackify(
    function (profileId, contentsToUnassign) {
        var data = {
            profileId: profileId,
            contentIds: contentsToUnassign
        };
        data = this.webBridge.buildPostData(data, null, false);

        return this.webBridge.post('/api/profiles/unassignContents', data, {}, false);
    }
);

/**
 * Delete a user profile.
 * @param {String} profileId The ID of the profile to remove.
 * @param {IntellogoCallback<SuccessResponse>} [callback]
 * @return {IntellogoResponse<SuccessResponse>}
 * @method
 */
UserProfilesAPI.prototype.deleteUserProfile = callbackify(
    function (profileId) {
        var data = this.webBridge.buildPostData([profileId], null, false),
            result = new events.EventEmitter();

        // The REST API only supports bulk profile deletion
        // on the original response, the 'data' event will contain a single-element array
        // with the result of the profile deletion.
        // Listen and reemit a single object instead of the array
        var originalResponse = this.webBridge.post('/api/profiles/remove', data, {}, false);
        originalResponse.once('error', result.emit.bind(result, 'error'));
        originalResponse.once('data', function (removedProfiles) {
            var removedProfile = removedProfiles[0];
            delete removedProfile.profileId;
            result.emit('data', removedProfile);
        });
        originalResponse.once('end', result.emit.bind(result, 'end'));
        return result;
    }
);

/**
 * Retrieve combinations of insights matching the user profile. These combinations can be used
 * to create smart collections relevant to the user profile.<br>
 * Each combination constists of two or more insights that matched enough of the profile's content.
 * Results are sorted by the number of profile content matched (descending). Typically there are
 * many relevant insight combinations, so it is advised to use the pagination parameters.<br>
 * *Note: This method will return results only if the user profile has `autoupdateCombinations` set
 * to `true` and a profile update task has finished since the last profile update.*
 * @param {String} profileId The ID of the profile
 * @param {UserProfilesAPI~CombinationOptions} options
 * @param {IntellogoCallback<UserProfilesAPI~ProfileCombination[]>} [callback]
 * @return {IntellogoResponse<UserProfilesAPI~ProfileCombination>}
 * @method
 */
UserProfilesAPI.prototype.getUserProfileInsightCombinations = callbackify(
    function (profileId, selectionOptions) {
        var data = _.merge(
            {profileId: profileId},
            selectionOptions
        );
        data = this.webBridge.buildPostData(data, null, false);

        return this.webBridge.post('/api/profiles/categoryCombinations', data, {}, true);
    }
);

module.exports = UserProfilesAPI;
