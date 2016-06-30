var WebBridge = require('./web-bridge'),
    mergeFns = require('./util/merge-fns').mergeFns,
    TrainingAPI = require('./api-groups/training-api'),
    SmartCollectionsAPI = require('./api-groups/smart-collections-api'),
    InsightsAPI = require('./api-groups/insights-api'),
    ContentAPI = require('./api-groups/content-api'),
    API_VERSION = '0.0.1',
    defaultConfig = {
        protocol: 'https',
        hostname: 'production.intellogo.com',
        port: 443,
        consumerKey: '<intellogo_key>',
        consumerSecret: '<intellogo_secret>'
    };

/**
 * Creates an instance of the IntellogoClient.
 * All methods return an <code>EventEmitter</code> that emits
 * <code>data</code> events with the requested data, or an
 * <code>error</code> event in case of an error.
 * Calling any of the methods will automatically get an OAuth2.0
 * <code>access_token</code>, which will be used for all subsequent requests.
 * The <code>access_token</code> will also be automatically renewed in case it
 * expires.
 * @param {Object} options
 * @param {String} options.clientId Your Intellogo clientId.
 * @param {String} options.clientSecret Your Intellogo clientSecret.
 * @param {String} [options.hostname=production.intellogo.com]
 * The hostname of the Intellogo server to connect to.
 * @param {Number} [options.port=443] The port at which the server is available.
 * @constructor
 * @mixes InsightsAPI
 * @mixes ContentAPI
 * @mixes SmartCollectionsAPI
 * @mixes TrainingAPI
 */
function IntellogoClient (options) {
    var opts = {
        hostname: options.hostname || defaultConfig.hostname,
        protocol: options.protocol || defaultConfig.protocol,
        port: options.port || defaultConfig.port,
        consumerKey: options.clientId,
        consumerSecret: options.clientSecret
    };
    this.webBridge = new WebBridge(API_VERSION, opts);
    mergeFns(this, TrainingAPI.prototype);
    mergeFns(this, ContentAPI.prototype);
    mergeFns(this, SmartCollectionsAPI.prototype);
    mergeFns(this, InsightsAPI.prototype);
}

module.exports = IntellogoClient;
