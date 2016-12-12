'use strict';

const q = require('q'),
      Model = require('./model');

class SmartCollectionFactory {

    constructor(api){
        this.api = api;
    }

    SmartCollection() {
        let that = this,
            smartCollectionClass = class extends Model {
                static get(id, callback) {
                    let deferred = q.defer();
                    that.api.getSmartCollectionsInfo([id], (error, smartCollections) => {
                        if (error || !smartCollections.length) {
                            deferred.reject(error || 'Smart collection does not exist');
                        } else {
                            deferred.resolve(smartCollections[0]);
                        }
                    });

                    if (callback) {
                        deferred.promise.nodeify(callback);
                    }
                    return deferred.promise;
                }

                /**
                 * @param {Object} options Filtering parameters
                 * @param {Object} [options.insightId] If specified, only smart collections
                 * containing this insight will be returned
                 */
                static query(options, callback) {
                    let deferred = q.defer();
                    that.api.getAllSmartCollections(
                        {categoryId: options.insightId},
                        (error, smartCollections) => {
                            if (error) {
                                deferred.reject(error);
                            } else {
                                deferred.resolve(smartCollections);
                            }
                        });
                    if (callback) {
                        deferred.promise.nodeify(callback);
                    }
                    return deferred.promise;
                }
            };

        return smartCollectionClass;
    }
}

module.exports = SmartCollectionFactory;
