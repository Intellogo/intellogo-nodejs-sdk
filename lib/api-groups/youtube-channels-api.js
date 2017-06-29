var _ = require('lodash'),
    callbackify = require('../util/callbackify').callbackify;

/**
 * Youtube Channel descriptor
 * @typedef {Object} YoutubeChannelsAPI~Channel
 * @property {String} id The Youtube ID of the channel
 * @property {String} title The name of the channel
 * @property {Number} videosCount Number of videos from this channel that are imported in Intellogo
 */

/**
 * Channel Import Params
 * @typedef {Object} YoutubeChannelsAPI~ImportParams
 * @property {Boolean} [autoSub] Whether to use the automatically generated Youtube subtitles,
 * or only user-uploaded subtitles
 * @property {Boolean} [refreshAll] If true, Intellogo will try to import all videos. Otherwise,
 * only recent videos (from last week) will be imported.
 * @property {Boolean} [enableCaptionsChunking] If true, enables the experimental chunking
 * behavior. The captions will be split in chunks of the specified length and they will be
 * separately imported. The video captions as a whole will still be imported.
 * @property {Number} [chunkSize] If chunking is enabled, the chunk size to use
 */

/**
 * Result from initiating a youtube import task
 * @typedef {Object} YoutubeChannelsAPI~Task
 * @property {String} channel The name of the channel for which import was initiated
 * @property {String} taskId The ID of the initiated task
 */

/**
 * A convenience class meant to group together youtube channels-related API.
 * All availables methods should be called directly through the
 * {@link IntellogoClient} object.
 * @mixin
 */
function YoutubeChannelsAPI () { }

/**
 * Retrieve information about all Youtube channels imported in Intellogo's system.
 * @param {IntellogoCallback.<YoutubeChannelsAPI~Channel[]> [callback]
 * @return {IntellogoResponse.<YoutubeChannelsAPI~Channel>}
 * @method
 */
YoutubeChannelsAPI.prototype.getImportedChannels = callbackify(function () {
    return this.webBridge.get('/api/captions/channels', {}, true);
});

/**
 * Initiate a Youtube channel import task. This method will call its callback immediately
 * after the task is initiated; it will not wait for its completion.<br>
 * If you want to be notified only on task completion,
 * use {@link YoutubeChannelsAPI#importChannel} instead
 * @param {String} channelUrl The URL to a Youtube channel
 * @param {YoutubeChannelsAPI~ImportParams} importOptions Import options
 * @param {IntellogoCallback.<YoutubeChannelsAPI~Task>} [callback]
 * @return {IntellogoResponse.<YoutubeChannelsAPI~Task>}
 * @method
 */
YoutubeChannelsAPI.prototype.initiateChannelImport =
    callbackify(function (channelUrl, importOptions) {
        var body = _.merge({}, { channel: channelUrl }, importOptions);

        var data = this.webBridge.buildPostData(body, null, false);
        return this.webBridge.post('/api/contents/initiateChannelImportTask',
                                   data,
                                   null,
                                   false);
    });

/**
 * Import all videos from a specified Youtube channel. Accepts the same arguments as
 * {@link YoutubeChannelsAPI#initiateChannelImport}, except the last argument must be a
 * callback function. The callback will be called once the task has finished.
 * Task status will be checked by polling.
 * @param {String} channelUrl The URL to a Youtube channel
 * @param {YoutubeChannelsAPI~ImportParams} importOptions Import options
 * @param {IntellogoCallback.<YoutubeChannelsAPI~Task>} [callback]
 * @method
 */
YoutubeChannelsAPI.prototype.importChannel = function () {
    // XXX: Depends on {@link TrainingAPI}
    var wrapped = this._wrapTaskExecution(
        this.initiateChannelImport.bind(this),
        {
            webhookSupport: false
        });
    wrapped.apply(this, arguments);
};

module.exports = YoutubeChannelsAPI;
