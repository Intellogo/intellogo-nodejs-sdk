/** @module web-bridge */

var https         = require('https'),
    http          = require('http'),
    events        = require('events'),
    fs            = require('fs'),
    Stream        = require('stream'),
    OAuth2        = require('oauth').OAuth2,
    QueryString   = require('querystring'),
    ZLib          = require('zlib'),
    JSONStream    = require('JSONStream'),
    FormData      = require('form-data'),
    _             = require('lodash'),
    ACCESS_TOKEN  = 'access_token',
    GRANT_TYPE    = 'grant_type';


//jshint maxparams: 5
function createOAuth2Instance(_config) {
    return new OAuth2(_config.consumerKey,
                      _config.consumerSecret,
                      _config.host,
                      null,
                      _config.authTokenPath,
                      null);
}
/**
 * Handles the transport of data to/from the web service.
 * @class
 * @param {string} options.hostname
 * @param {int} options.port
 * @param {string} options.consumerKey
 * @param {string} options.consumerSecret
 */
function WebBridge(apiVersion, options) {
    // jshint maxstatements:30
    var self = this,
        _config, _oAuth2, _accessToken = null, _refreshToken = null;

    _config = {
        hostname: options.hostname,
        protocol: options.protocol,
        port: options.port,
        consumerKey: options.consumerKey,
        consumerSecret: options.consumerSecret,
        authTokenPath: '/oauth/token'
    };
    _config.host = [_config.protocol,
                    '://',
                    _config.hostname,
                    ':',
                    _config.port].join('');
    _oAuth2 = createOAuth2Instance(_config);

    /**
     * Build an object to pipe the server response through.
     * If the server response is a JSON array, each element will be
     * emitted separately; If the response is a JSON object, each
     * of its values will be emitted separately
     * @private
     */
    function buildStreamResponse(parameters) {
        var response = new events.EventEmitter();
        response.stream = JSONStream.parse('*');
        response.index = 0;
        response.stream.on('data', function (data) {
            response.emit('data', data,
                          parameters && parameters[response.index++]);
        });
        response.stream.on('end', response.emit.bind(response, 'end'));
        response.once('error', (error) => {
            response.emit('error', error, parameters);
        });
        response.isIntellogoStream = true;
        return response;
    }

    /**
     * Build an object to pipe the server response through.
     * It parses all of the data at once and will emit only a
     * complete JSON object with the result
     */
    function buildNonStreamResponse() {
        var response = new events.EventEmitter();
        var allData = '';
        response.stream = new Stream.PassThrough();
        response.stream.on('data', function (data) {
            allData += data;
            // response.emit('data', JSON.parse(data));
        });
        response.stream.once('end', function () {
            if (allData && allData.length) {
                // ugly, but sometimes the server returns plaintext
                // and not json
                // e.g. with empty OK responses
                try {
                    allData = JSON.parse(allData);
                } catch (e) {
                    // it was plaintext after all, leave it as it is
                }
                response.emit('data', allData);
            }
            process.nextTick(function () {
                response.emit('end');
            });
        });
        response.isIntellogoStream = false;
        return response;
    }

    /**
     * Save the access token received by the server.
     * @private
     */
    function getAccessTokenHandler(e, accessToken, refreshToken) {
        var queue = this.authCallbackQueue,
            i = 0;
        this.authenticating = false;
        if(e) {
            _accessToken  = null;
            _refreshToken = null;
            e = new Error(JSON.stringify(e));
        } else {
            _accessToken  = accessToken;
            _refreshToken = refreshToken;
        }
        while(i < queue.length) {
            queue[i](e);
            i++;
        }
        this.authCallbackQueue = [];
    }

    function get(requestPath, query, shouldStreamResponse) {
        return request('GET', requestPath, null, query, shouldStreamResponse);
    }

    function post(requestPath, postBody, query, shouldStreamResponse) {
        return request('POST', requestPath, postBody, query,
                       shouldStreamResponse);
    }

    function put(requestPath, postBody, query, shouldStreamResponse) {
        return request('PUT', requestPath, postBody, query,
                       shouldStreamResponse);
    }

    function deleteReq(requestPath, query, shouldStreamResponse) {
        return request('DELETE', requestPath, null, query,
                       shouldStreamResponse);
    }

    function buildPostData(params, includedProps, asArray) {
        var result = {};
        // by default turn single-parameter sets into arrays
        if (asArray === undefined) {
            asArray = true;
        }
        // In case this is a single parameter set
        if (params && !Array.isArray(params) && asArray) {
            params = [ params ];
        }

        result.postData = JSON.stringify(params, includedProps);
        result.params = params;
        return result;
    }

    function buildFormData(formData, fileKeys) {
        var form = new FormData(), prop;
        fileKeys = fileKeys || [];

        function appendFileToForm(propName, propValue) {
            if (typeof propValue === 'string') {
                form.append(propName, fs.createReadStream(propValue));
            } else {
                form.append(propName, propValue.stream, propValue.options);
            }
        }

        function addToFormDataRecursive(propName, propValue) {
            _.each(propValue, function (value, key) {
                var formKey = propName + '[' + key + ']';
                if (_.isPlainObject(value)) {
                    addToFormDataRecursive(formKey, value);
                } else {
                    form.append(formKey, '' + value);
                }
            });
        }

        for (prop in formData) {
            if (formData.hasOwnProperty(prop)) {
                if (fileKeys.indexOf(prop) !== -1) {
                    appendFileToForm(prop, formData[prop]);
                } else if (_.isPlainObject(formData[prop])) {
                    addToFormDataRecursive(prop, formData[prop]);
                } else {
                    // form data does not understand anything except strings
                    // so we turn number and boolean values to string
                    form.append(prop, '' + formData[prop]);
                }
            }
        }
        return {
            postData: form
        };
    }

    /**
     * Add common headers, i.e. accept, accept-encoding, user-agent
     * @private
     * @param {Object} headers
     */
    function addCommonHeaders(headers) {
        var prop,
            result = {
                'Accept-Encoding': 'identity;q=0.1,deflate;q=0.5,gzip;q=0.7',
                'Accept': 'application/json, json',
                'content-type': 'application/json',
                'User-Agent': 'Intellogo-' + apiVersion + '-oauth'
            };
        for (prop in headers) {
            if (headers.hasOwnProperty(prop)) {
                result[prop] = headers[prop];
            }
        }
        return result;
    }

    /**
     * Pipe the server's response through a decompress stream, if necessary.
     * @private
     * @param {StreamResponse} destination
     * @param {ReadableStream} serverResponse
     */
    function pipeResponse(destination, source) {
        var contentEncoding, decodeStream, responseStream;

        contentEncoding = source.headers['content-encoding'] || 'identity';

        switch (contentEncoding) {
        case 'gzip':
            decodeStream = ZLib.createGunzip();
            break;
        case 'deflate':
            decodeStream = ZLib.createInflate();
            break;
        default:
            decodeStream = null;
        }

        if (decodeStream) {
            // Error event is not emitted on the receiving stream...
            source.on('error', decodeStream.emit.bind(decodeStream, 'error'));
            source.pipe(decodeStream);
            responseStream = decodeStream;
        } else {
            responseStream = source;
        }

        responseStream.on('error', destination.emit.bind(destination, 'error'));
        responseStream.on('data', destination.stream.write
                          .bind(destination.stream));
        responseStream.on('end', destination.stream.emit
                          .bind(destination.stream, 'end'));
        responseStream.on('close', destination.emit.bind(destination, 'close'));
    }

    /**
     * @private
     */
    function request(method,
                     requestPath,
                     postBody,
                     query,
                     shouldStreamResponse) {
        if (shouldStreamResponse === undefined) {
            shouldStreamResponse = true;
        }
        var isFormData = postBody && postBody.postData instanceof FormData,
            headers = isFormData? postBody.postData.getHeaders() : {},
            withCommonHeaders = addCommonHeaders(headers),
            result = shouldStreamResponse?
                buildStreamResponse(postBody && postBody.params) :
                buildNonStreamResponse(),
            requestConfig;

        query = query || {};
        requestConfig = {
            requestPath: requestPath,
            query: query,
            // actual 'http' or 'https' config
            hostname: _config.hostname,
            port: _config.port,
            method: method,
            headers: withCommonHeaders,
            agent: null
        };

        executeRequest(requestConfig, result, postBody);
        return result;
    }

    function authenticationHandler(requestConfig, result, postBody, error) {
        if(error) {
            result.emit('error', error);
        } else {
            executeRequest(requestConfig, result, postBody);
        }
    }
    function executeRequest(requestConfig, result, postBody) {
        //jshint maxcomplexity: 6
        function sendPostBody(postBody, method, requestObj) {
            var buffer, stringData;
            if (!postBody || (method !== 'POST' && method !== 'PUT')) {
                requestObj.end();
                return;
            }
            if (postBody.postData instanceof FormData) {
                postBody.postData.pipe(requestObj);
            } else {
                if (typeof postBody.postData !== 'string' &&
                    !(postBody.postData instanceof String)) {
                    stringData = JSON.stringify(postBody.postData);
                } else {
                    stringData = postBody.postData;
                }

                buffer = new Buffer(stringData, 'utf-8');
                ZLib.gzip(buffer, function (error, data) {
                    requestObj.setHeader('Content-Encoding', 'gzip');
                    requestObj.setHeader('Content-Length', data.length);
                    requestObj.end(data);
                });
            }
        }

        var lib = _config.protocol === 'http' ? http : https,
            method = requestConfig.method,
            requestObj;
        if (_accessToken === null) {
            self.authenticate(authenticationHandler.bind(null,
                                                         requestConfig,
                                                         result,
                                                         postBody));
          return;
        }
        // Must be built AFTER successful authentication
        requestConfig.query[ACCESS_TOKEN] = _accessToken;
        requestConfig.path = requestConfig.requestPath +
            '?' +
            QueryString.stringify(requestConfig.query);

        requestObj = lib.request(requestConfig, function(response) {
            if (response.statusCode === 401) {
                // OAuth error due to expired access token
                // request new token and retry the request
                _accessToken = null;
                // Make sure the stream is consumed so that it is closed
                // otherwise it stays open and blocks the connection pool
                response.resume();
                response.on('end', function() {
                    self.authenticate(authenticationHandler.bind(null,
                                                                 requestConfig,
                                                                 result,
                                                                 postBody));
                });
            } else if (response.statusCode < 200 ||
                       response.statusCode >= 400) {
                // http error, collect the error response and
                // emit an error event on the result stream
                var errData = '';
                response.on('data', function (data) {
                    errData += data.toString();
                });
                response.on('end', function () {
                    result.emit('error', new Error(errData));
                });
            } else {
                // all good, pipe the response
                pipeResponse(result, response);
            }
        });

        sendPostBody(postBody, method, requestObj);
    }

    /**
     * @private
     */
    function authenticate(callback) {
        var parameters = {};
        parameters[GRANT_TYPE] = 'client_credentials';

        if (callback) {
            this.authCallbackQueue.push(callback);
        }
        var that = this;
        if (!this.authenticating) {
            this.authenticating = true;
            _oAuth2.getOAuthAccessToken('', parameters,
                                        getAccessTokenHandler.bind(that));
        }
    }

    // Members
    /**
     * Attempt to authenticate.
     */
    this.authenticate = authenticate;
    /**
     * Generic send of an HTTP request to the configured host.
     * @param {string} method
     * @param {string} requestPath
     * @param {APICallback} callback
     * @param {string} postBody
     * @param {object} query
     * @param {object} headers
     */
    this.request = request;
    /**
     * GET request to the configured host.
     */
    this.get = get;
    /**
     * POST request to the configured host.
     */
    this.post = post;
    /**
     * PUT request to the configured host.
     */
    this.put = put;
    /**
     * DELETE request to the configured host.
     */
    this.delete = deleteReq;
    /**
     * Construct uniform POST data from an object or an array of objects.
     * Optionally filter properties from
     * the given parameters to reduce request size.
     * @param {Object|Array} params
     * @param {Array<string>} [includedProps=[]]
     */
    this.buildPostData = buildPostData;

    /**
     * Creates an object that can be used for a form-encoded POST request
     * If any <code>fileKeys</code> are specified, the respective values
     * in the <code>formData</code> param are interpeted as filenames
     * and are streamed as part of the multi-part data.
     * @param {Object} formData An object containing all form data
     * @param {String[]} [fileKeys] The keys from formData that reference a file
     * @return {Object} An object that can be passed to
     * <code>WebBridge.post</code>
     */
    this.buildFormData = buildFormData;
    /**
     * @private
     */
    this.authCallbackQueue = [];
}

module.exports = WebBridge;
