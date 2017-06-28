var _ = require('lodash'),
    events = require('events'),
    stream = require('stream'),
    callbackify = require('../util/callbackify').callbackify;

/**
 * Metadata properties supported on article import. If any of the optional fields are missing,
 * Intellogo will attempt to automatically extract that information during import.
 * @typedef {Object} ImportAPI~ArticleImportMetadata
 * @property {String} [source] The name of the article source
 * @property {String} [author] Author of the article.
 * @property {String} [title] Title of the article.
 * @property {String} [summary] Summary of the article.
 * @property {String} [id] Source ID to assign to the article. If not specified, the URL will be
 * used as sourceId.
 * @property {String} [imageUrl] URL to an image relevant to the article.
 */

/**
 * @typedef {Object} ImportAPI~ArticleImportOptions
 * @property {Boolean} [enableChunking=false] Whether the article should be split into equal-sized
 * chunks on import. Useful for providing more in-depth analysis of very long articles.
 * @property {Number} [chunkSize] The size of each article chunk, if splitting is enabled.
 */

/**
 * @typedef {Object} ImportAPI~ArticleImportResult
 * @property {Boolean} success Whether the import was successful
 * @property {String} [error] If the import did not succeed, this contains an error message.
 * Possible reasons for failure:
 * <ul>
 *   <li>Article is too short</li>
 *   <li>Problems parsing article content</li>
 *   <li>The article is already present in Intellogo's database</li>
 *   <li>Other unexpected problems</li>
 * @property {String} id If the import succeeded, this is the IntellogoID of the article.
 * Can be used to e.g. generate and retrieve recommendations.
 * @property {String} title The title of the imported article.
 * @property {Array<String>} existingIds If the article import failed because the article is already
 * present in Intellogo's database, this array contains the IntellogoIDs of the possible duplicates
 * detected. This array will usually have only one element.
 */

/**
 * @typedef {Object} ImportAPI~SubtitlesImportOptions
 * @property {String} [chunkingMode] What chunking to apply to the imported subtitles.
 * Allowed values: `length-based` or `timestamp-based`
 * @property {Number} [chunkSize] Length (in characters) of each chunk.
 * *<br>Required if `chunkingMode` is `length-based`.*
 * @property {String} [timestampsFile] The path to a file specifying timestamps on which to split
 * the subtitles. This must be a text file. Every line specifies a splitting point in the captions
 * in the format `hh:mm:ss,ms <ENTRY NAME>`. Every splitting point will create a new content chunk
 * containing all captions between the previous line and this line's timestamp. `ENTRY NAME` will
 * be used as title in the chunk's metadata.<br>
 * For example, a timestamp file with two lines
 * ```
 * 00:15:00,000 First Half
 * 00:30:00,000 Second Half
 * ```
 * will create two chunks from the subtitles file - one with all captions from the first 15 minutes
 * and one with all captions from 00:15 until 00:30 minutes into the subtitles. If the subtitles
 * file contains captions after the 30th minute, they will not be included in any chunk (although
 * they will be used when importing the full content).
 * <br>*Required if `chunkingMode` is `timestamp-based`.*
 */

/**
 * A convenience class meant to group together API for importing content.
 * All availables methods should be called directly through the
 * {@link IntellogoClient} object.
 * @mixin
 */
function ImportAPI () { }

/**
 * Import the specified article.
 * @param {String} articleUrl The URL of the article to import
 * @param {ImportAPI~ArticleImportMetadata} [metadata] Metadata to assign to the imported article
 * @param {ImportAPI~ArticleImportOptions} [options] Import options
 * @param {IntellogoCallback.<ImportAPI~ArticleImportResult>} [callback]
 * @returns {IntellogoResponse.<ImportAPI~ArticleImportResult>}
 * @method
 */
ImportAPI.prototype.importArticle = callbackify(importArticle);
function importArticle(articleUrl, metadata, options) {
    var articleForImport = {
        url: articleUrl
    }, result = new events.EventEmitter();
    _.merge(articleForImport, metadata, options);
    var data = {
        dataForImport: [articleForImport]
    };

    data = this.webBridge.buildPostData(data, null, false);

    var originalResponse = this.webBridge.post('/api/contents/importArticles', data, {}, false);
    originalResponse.once('data', function (data) {
        // This is an array with one element, because we are importing a single article.
        // Reemit the single element of this array
        result.emit('data', data[0]);
    });
    originalResponse.once('error', result.emit.bind(result, 'error'));
    originalResponse.once('end', result.emit.bind(result, 'end'));
    return result;
}

/**
 * Import an .srt file containing timestamped subtitles. Metadata **must** be supplied, there is
 * no automated metadata extraction for .srt files.<br>
 * Intellogo supports two modes of chunking for .srt files:
 * * length-based chunking: This is the standard chunking, like the one for articles. The text
 * content of the subtitles is split into equally-sized chunks.
 * * timestamp-based chunking: If a timestamp separator file is provided, each chunk will contain
 * the captions with timestamp between consecutive lines of the timestamp separator file.
 * This allows splitting the subtitles in a more semantic way - e.g. for a documentary's subtitles
 * the user can manually specify the timestamps at which a new topic begins.
 * @param {String} subtitlesPath The absolute path to the .srt file for import
 * @param {ContentAPI~ContentMetadata|String} metadata Metadata to assign to the imported content.
 * If the value is a string, it is the path to a json file with the metadata.
 * Otherwise, the object contains all relevant metadata.
 * @param {ImportAPI~SubtitlesImportOptions} importOptions Import options. Use to enable chunking
 * for the imported subtitles.
 * @param {IntellogoCallback.<ImportAPI~ArticleImportResult>} [callback]
 * @return {IntellogoResponse.<ImportAPI~ArticleImportResult>}
 * @method
 */
ImportAPI.prototype.importSubtitles = callbackify(
    function (subtitlesPath, metadata, importOptions) {
        var metadataFormFile = metadata;
        if (typeof metadata !== 'string') {
            // The API expect a file with the metadata to be uploaded
            // So we'll create a dummy stream to pass as the form data
            // this way we avoid creating a temp file that we would need to delete later
            var metadataStream = new stream.PassThrough();
            var metadataString = JSON.stringify(metadata);
            metadataStream.end(metadataString);
            metadataFormFile = {
                stream: metadataStream,
                options: {
                    filename: 'metadata.json',
                    contentType: 'application/json',
                    knownLength: metadataString.length
                }
            };
        }
        var formData = _.merge(
            {
                subtitles: subtitlesPath,
                metadata: metadataFormFile
            },
            importOptions
        );


        var data = this.webBridge.buildFormData(
            formData,
            ['subtitles', 'metadata', 'timestampsFile']
        );

        return this.webBridge.post('/api/contents/importSubtitles', data, {}, false);
    }
);

module.exports = ImportAPI;
