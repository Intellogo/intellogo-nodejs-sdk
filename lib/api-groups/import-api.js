var _ = require('lodash'),
    events = require('events'),
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

module.exports = ImportAPI;
