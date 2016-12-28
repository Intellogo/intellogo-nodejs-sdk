var _ = require('lodash'),
    WebBridge = require('./web-bridge'),
    NotificationsWebService = require('./notifications/web-service'),
    ApiMerger = require('./util/api-merger'),
    TrainingAPI = require('./api-groups/training-api'),
    SmartCollectionsAPI = require('./api-groups/smart-collections-api'),
    InsightsAPI = require('./api-groups/insights-api'),
    ContentAPI = require('./api-groups/content-api'),
    RecommendationsAPI = require('./api-groups/recommendations-api'),
    ModelFactory = require('./models/factory'),
    API_VERSION = '0.0.1',
    defaultConfig = {
        protocol: 'https',
        hostname: 'production.intellogo.com',
        port: 443,
        consumerKey: '<intellogo_key>',
        consumerSecret: '<intellogo_secret>'
    };

/**
 * @typedef {Object} OAuthOptions
 * @property {String} clientId Your Intellogo clientId.
 * @property {String} clientSecret Your Intellogo clientSecret.
 * @property {String} [hostname=production.intellogo.com]
 * The hostname of the Intellogo server to connect to.
 * @property {Number} [port=443] The port at which the server is available.
 */

/**
 * Creates an instance of the IntellogoClient.
 * All methods accept an optional callback argument as their last
 * parameter.<br>
 * All methods also return an <code>EventEmitter</code> that emits
 * <code>data</code> events with the requested data, or an
 * <code>error</code> event in case of an error. However, it is recommended
 * to use the callback option.
 * <br>
 * Calling any of the methods will automatically get an OAuth2.0
 * <code>access_token</code>, which will be used for all subsequent requests.
 * The <code>access_token</code> will also be automatically renewed in case it
 * expires.
 * @param {OAuthOptions} options Options to use for connecting to the Intellogo service
 * @constructor
 * @mixes RecommendationsAPI
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

    // TODO: better name for the property?
    Object.defineProperty(this, 'endpoints', {
        get: () => {
            // allow methods merged through the ApiMerger to be accessed through an 'endpoints'
            // property for better separation between thinly wrapped 'endpoints' methods
            // and the classes from the Model abstraction
            return this;
        }
    });

    this.classes = {};
    var factory = new ModelFactory(this);
    _.merge(this.classes, factory);
}

/**
 * Sets up a local web service that provides a better alternative for the task polling mechanism.
 * While the service is running, it will be used instead of polling when possible.
 * @param {NotificationsWebService~NotificationOptions} notificationOptions
 * Options to use for setting up the local web service
 * @param {Function} [callback] A callback that will be called when the service is up and running.
 */
IntellogoClient.prototype.initNotificationsService = function (notificationOptions,
                                                               callback) {
    this.webService = new NotificationsWebService(notificationOptions);
    this.webService.init(callback);
};

/**
 * Stops the local web service, if it is still running. After this is done, the
 * {@link IntellogoClient} can still be used as usual. The only difference will be that waiting
 * for task completion will use the polling mechanism, sending status requests at some polling
 * interval.
 * @param {Function} [callback] An optional callback that will be called once the web service
 * has been stopped.
 */
IntellogoClient.prototype.stopNotificationsService = function (callback) {
    if (this.webService) {
        this.webService.destroy(callback);
    }
    this.webService = null;
};

var plainMerger = new ApiMerger(IntellogoClient.prototype, []);
plainMerger.merge(ContentAPI,
                  SmartCollectionsAPI,
                  InsightsAPI,
                  RecommendationsAPI,
                  TrainingAPI);

module.exports = IntellogoClient;
