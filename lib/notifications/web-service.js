'use strict';

var connect = require('connect'),
    qs = require('qs'),
    bodyParser = require('body-parser'),
    uuid = require('node-uuid');

var WEBHOOK_ENDPOINT = '/notify',
    QUERY_PARAM_NAME = 'hookId';

/**
 * Options to use for setting up a local web service. The web service will be
 * used only to improve the mechanism for notifications on finished tasks.
 * Otherwise, a simple polling is used.
 * <br>
 * <i>N.B.: Make sure that the specified ip:port combination is accessible
 * from outside your local network, or task notifications may not work as
 * expected</i>
 * @typedef {Object} NotificationsWebService~NotificationOptions
 * @property {String} hostname A hostname to use for reaching the web service
 * @property {Number} port The port number
 */

/**
 * A simple web service that can register callbacks for specific webhooks
 * and triggers them when a POST request is received.
 */
class NotificationsWebService {
    /**
     * Constructs a {@link NotificationsWebService} object
     * @param {NotificationsWebService~NotificationOptions} options
     */
    constructor (options) {
        this.notifiers = {};
        this.options = {
            hostname: options.hostname,
            port: options.port
        };
        this.app = connect();
        this.app.use(WEBHOOK_ENDPOINT, bodyParser.json());
        this.app.use(WEBHOOK_ENDPOINT, this._handleWebhookRequest.bind(this));
    }

    _extractHookId (url) {
        var queryStart = url.indexOf('?');
        if (queryStart === -1) {
            return null;
        }
        var queryParams = qs.parse(url.substring(queryStart + 1));
        return queryParams[QUERY_PARAM_NAME];
    }

    _handleNotification (hookId, notificationData) {
        var callback = this.notifiers[hookId];
        if (callback) {
            process.nextTick(() => {
                callback((notificationData && notificationData.error),
                         notificationData);
            });
            delete this.notifiers[hookId];
        }
    }

    _handleWebhookRequest (req, res) {
        var hookId = this._extractHookId(req.url);
        if (req.method !== 'POST' || !hookId) {
            // bad webhook request
            res.end();
            return;
        }
        var body = req.body;
        this._handleNotification(hookId, body);
        res.end();
    }

    /**
     * Initializes the web service HTTP server
     * @callback [callback] An optional callback that will be called
     * when the server is up and listening on the specified port.
     */
    init(callback) {
        this.server = this.app.listen(this.options.port, callback);
    }

    /**
     * Stops the underlying HTTP server. No more connections will be
     * accepted.
     * @callback [callback] Optional callback that will be called
     * when the server has been stopped.
     */
    destroy(callback) {
        this.server.close(callback);
    }

    _buildWebhook(hookId) {
        return 'http://' + this.options.hostname + ':' + this.options.port +
            WEBHOOK_ENDPOINT + '?' + QUERY_PARAM_NAME + '=' + hookId;
    }

    /**
     * Creates a webhook and registers the given function for it.
     * When a request is sent to this service on the generated URL,
     * the function will be called as a callback with two arguments:
     * an error (falsy value if the task was executed successfully),
     * and a result object.
     * @param {Function} fn The callback to call once the webhook is triggered.
     * @return {String} url The webhook URL
     */
    registerWebhook(fn) {
        var callbackId = uuid.v4();
        this.notifiers[callbackId] = fn;
        return this._buildWebhook(callbackId);
    }
}

module.exports = NotificationsWebService;
