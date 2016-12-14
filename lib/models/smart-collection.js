'use strict';

const _ = require('lodash'),
      q = require('q'),
      Model = require('./model'),
      MetadataWrapper = require('./metadata-wrapper');

class SmartCollectionFactory {

    constructor(api){
        this.api = api;
    }

    SmartCollection() {
        let that = this,
            Models = this.api.classes,
            SmartCollectionClass = class extends Model {
                allowedProperties() {
                    return ['_id', 'metadata', 'items'];
                }

                allowedMetadataProperties() {
                    return ['name', 'displayName', 'readonly', 'image','modifiedTime',
                            'invalidate', 'tags', 'description', 'importance',
                            'productionReady', 'autoupdate'];
                }

                constructor(smartCollectionData, fromAPI) {
                    super(smartCollectionData);
                    this._factory = that._factory;
                    this.metadata = new MetadataWrapper(smartCollectionData.metadata, this);
                    this.items = fromAPI?
                        Models.SmartCollectionItems.fromAPIArray(smartCollectionData.items, this):
                        new Models.SmartCollectionItems(smartCollectionData.items, this);
                }

                _buildObjectToSave(options) {
                    let toSave = {};
                    if (options.metadata) {
                        toSave.metadata = this.metadata.toPlainObject();
                    }
                    if (options.items) {
                        toSave.items = this.items.toArray();
                    }
                    console.log(toSave);
                    return toSave;
                }

                save(options, callback) {
                    let deferred = q.defer();
                    if (!options) {
                        options = {metadata: true, items: true};
                    } else if(typeof options === 'function') {
                        callback = options;
                        options = {metadata: true, items: true};
                    }
                    deferred.promise.nodeify(callback);

                    let toSave = this._buildObjectToSave(options);
                    if (_.isEmpty(toSave)) {
                        // nothing to save
                        deferred.resolve();
                        return;
                    }

                    // TODO: reuse insight logic for _id existence
                    if (this._id) {
                        toSave._id = this._id;
                        that.api.updateSmartCollections([toSave], (error, result) => {
                            result = result && result[0];
                            if (error || !result.success) {
                                deferred.reject(error || result.error);
                            } else {
                                deferred.resolve(this);
                            }
                        });
                    } else {
                        console.log(toSave);
                        that.api.createSmartCollections([toSave], (error, result) => {
                            result = result && result[0];
                            console.error(error);
                            console.error(result);
                            if (error || !result || !result.id) {
                                deferred.reject(error || 'Could not create smart collection');
                            } else {
                                this._id = result.id;
                                deferred.resolve(this);
                            }
                        });
                    }
                }

                static get(id, options, callback) {
                    let deferred = q.defer();
                    that.api.getSmartCollectionsInfo([id], (error, smartCollections) => {
                        if (error || !smartCollections.length) {
                            deferred.reject(error || 'Smart collection does not exist');
                        } else {
                            deferred.resolve(new SmartCollectionClass(smartCollections[0], true));
                        }
                    });

                    if(_.isFunction(options)) {
                        deferred.promise.nodeify(options);
                    } else {
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
                                deferred.resolve(_.map(
                                    smartCollections,
                                    (collection) => new SmartCollectionClass(collection, true)));
                            }
                        });
                    if (callback) {
                        deferred.promise.nodeify(callback);
                    }
                    return deferred.promise;
                }
            };

        return SmartCollectionClass;
    }
}

module.exports = SmartCollectionFactory;
