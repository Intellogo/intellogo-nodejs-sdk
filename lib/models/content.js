'use strict';

const _ = require('lodash'),
    q = require('q'),
    Model = require('./model');

class ContentFactory {

    constructor(api){
        this.api = api;
    }

    Content() {
        let that = this,
            contentClass = class extends Model {
                allowedProperties() { return ['_id', 'metadata']; }
                
                static get(id, options, callback) {
                    let deferred = q.defer();
                    
                    that.api.getContentById(id, (err, response) => {
                        if (err) {
                            deferred.reject(JSON.parse(err.message));
                        } else {
                            deferred.resolve(new this(response));
                        }
                        if(_.isFunction(options)) {
                            deferred.promise.nodeify(options);
                        } else {
                            deferred.promise.nodeify(callback);
                        }
                    });
                    return deferred.promise;
                }
            };

        return contentClass;
    }
}

module.exports = ContentFactory;
