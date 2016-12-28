'use strict';

const _ = require('lodash'),
    InsightSamplesFactory = require('./insight-samples'),
    ErrorsMessages = require('../errors/error-messages'),
    q = require('q'),
    async = require('async'),
    Model = require('./model');


// TODO
// XXX temporary
if (!String.prototype.format) {
    String.prototype.format = function () {
        let args = arguments;
        return this.replace(/{(\d+)}/g,
                            (match, number) => typeof args[number] !== 'undefined'?
                                               args[number]:
                                               match
        );
    };
}

class InsightFactory {

    constructor(api) {
        this.api = api;
        this.InsightSamplesClass = (new InsightSamplesFactory(api)).InsightSamples();
    }

    Insight() {
        let that = this,
            insightClass = class extends Model {
                /**
                 * @def Content
                 */
                /**
                 * @param properties {Object}
                 * @param properties.samples {Object[]}
                 * @param properties.testSamples {Object[]}
                 */
                constructor(properties) {
                    properties = properties ? properties : {};
                    super(properties);
                    this.samples = new that.InsightSamplesClass(properties.samples);
                    this.testSamples = new that.InsightSamplesClass(properties.testSamples);
                }

                allowedProperties() {
                    return [
                        '_id',
                        'name',
                        'displayName',
                        'tags',
                        'productionReady',
                        'modifiedTime',
                        'keywords',
                        'autoupdate',
                        'description',
                        'userTrained',
                        'useTSVD',
                        'locked',
                        'readonly',
                        'samples',
                        'testSamples'
                    ];
                }
                
                /**
                 * Saves the Insight object.
                 * If the object has no _id property, this will create new object.
                 * If there is _id property, will update already existing object.
                 * @param {SaveOptions} options 'Not Implemented'
                 * @param callback
                 * @returns {*|promise} Promise of the same object, modified.
                 */
                save(options, callback) {
                    if (this._id) {
                        // update
                        let deferred = q.defer();
                        let update = _.merge(this.toPlainObject(), {categoryId: this._id});

                        that.api.updateInsights([update], (err, res) => {
                            if (err) {
                                deferred.reject(JSON.parse(err.message));
                            } else {
                                if (res[0].success) {
                                    deferred.resolve(this);
                                } else {
                                    deferred.reject({errors: [res[0].error]});
                                }
                            }

                            deferred.promise.nodeify(callback);
                        });

                        return deferred.promise;
                    } else {
                        let deferred = q.defer();

                        that.api.createInsights([this.toPlainObject()], (err, res) => {
                            if (err) {
                                deferred.reject(JSON.parse(err.message));
                            } else {
                                this._id = res[0]._id;
                                deferred.resolve(this);
                            }

                            deferred.promise.nodeify(callback);
                        });

                        return deferred.promise;
                    }
                }

                /**
                 * @typedef {Object} MetadataOptions
                 * @property {boolean} [metadata=true] If true,
                 * metadata of the sample will be loaded
                 */
                /**
                 * @typedef {Object} LoadOptions
                 * @property {boolean} [metadata=true] If true,
                 * metadata of the object will be laoded
                 * @property {boolean|MetadataOptions} samples If truthy,
                 * the samples will be loaded
                 * @property {boolean|MetadataOptions} testSamples If truthy,
                 * the test samples will be loaded
                 */
                /**
                 * Loads the object
                 * @param {LoadOptions} options If options are not passed,
                 * metadata and samples/testSamples will be loaded.
                 * @param callback
                 * @returns {*|promise} Promise of Insight object. Returns this object, modified.
                 */
                load(options, callback) {
                    let deferred = q.defer();
                    let tasks = [
                        (callback) => {
                            process.nextTick(() => {
                                callback(null, this);
                            });
                        }
                    ];

                    if (_.get(options, 'metadata') !== false) {
                        tasks.push(this._loadMetadata.bind(this));
                    }
                    if (_.get(options, 'samples') !== false) {
                        let metadata = _.get(options, 'samples.metadata', true);
                        tasks.push(this._loadSamples.bind(this, metadata));
                    }
                    if (_.get(options, 'testSamples') !== false) {
                        let metadata = _.get(options, 'samples.metadata', true);
                        tasks.push(this._loadTestSamples.bind(this, metadata));
                    }

                    async.parallel(
                        tasks,
                        (err, insights) => {
                            if (err) {
                                deferred.reject(err);
                            } else {
                                deferred.resolve(insights[0]);
                            }
                            deferred.promise.nodeify(callback);
                        }
                    );

                    return deferred.promise;
                }

                remove(callback) {
                    let deferred = q.defer();

                    that.api.deleteInsights([this._id], (err, res) => {
                        if (err) {
                            deferred.reject(JSON.parse(err.message));
                        } else {
                            deferred.resolve(res);
                        }
                        deferred.promise.nodeify(callback);
                    });
                    return deferred.promise;
                }

                _loadMetadata(callback) {
                    let deferred = q.defer();

                    that.api.getInsightsInfo([this._id], (err, res) => {
                        if (err) {
                            deferred.reject(JSON.parse(err.message));
                        } else {
                            let found = _.get(res, this._id);
                            if (found) {
                                this.assignProperties(found);
                                deferred.resolve(this);
                            } else {
                                deferred.reject(
                                    {errors: ['Item with id: ' + this._id + ' not found.']}
                                );
                            }
                        }
                        deferred.promise.nodeify(callback);
                    });

                    return deferred.promise;
                }
                
                _loadSamplesByType(type, metadata, callback) {
                    let insight = this;
                    return new Promise((resolve, reject) => {
                        let apiCall = type === 'samples' ?
                            that.api.getInsightsSamples.bind(that.api) :
                            that.api.getInsightsTestSamples.bind(that.api);

                        apiCall(
                            [{
                                metadata: !!metadata,
                                categoryId: insight._id
                            }],
                            this.modelMethodResponse(
                                (insight, insightArr) => {
                                    if (insightArr && insightArr[0] === null) {
                                        return ErrorsMessages.GENERAL.NOT_FOUND.format(insight._id);
                                    }

                                    let toSample = (sample) => {
                                        let properties = _.merge(sample, {_id: sample.contentId});
                                        return {
                                            content: new that.api.classes.Content(properties),
                                            positive: sample.positive
                                        };
                                    };

                                    let transform = _.map(insightArr[0][type], toSample);

                                    insight[type] = new that.InsightSamplesClass(transform);
                                },
                                resolve,
                                reject,
                                callback));
                    });
                }

                _loadSamples(metadata, callback) {
                    return this._loadSamplesByType('samples', metadata, callback);
                }

                _loadTestSamples(metadata, callback) {
                    return this._loadSamplesByType('testSamples', metadata, callback);
                }

                _saveSamples(callback) {
                    let insight = this;
                    return new Promise((resolve, reject) => {
                        let toSSSs = (sam) => {
                            return {
                                contentId: sam.content._id,
                                positive: sam.positive
                            };
                        };
                        that.api.setInsightsSamples(
                            [{
                                categoryId: insight._id,
                                samples: _.map(insight.samples.toArray(), toSSSs),
                                testSamples: _.map(insight.samples.toArray(), toSSSs)
                            }],
                            this.modelMethodResponse(
                                (insight, insightArr) => {},
                                resolve,
                                reject,
                                callback));
                    });
                }

                _saveTestSamples(callback) {
                    throw Error('_saveTestSamples is not implemented');
                }

                static get(id, options, callback) {
                    let insight = new this({_id: id});
                    if (_.isFunction(options)) {
                        return insight.load({}, options);
                    } else {
                        return insight.load(options, callback);
                    }
                }

                //TODO: write doc
                //{status: ["new", "forReview", "ready"], searchTerm: 'string'}
                static query(options, callback) {
                    let deferred = q.defer();

                    that.api.getAllInsights(options.searchTerm, options.status, (err, res) => {
                        if (err) {
                            deferred.reject(JSON.parse(err.message));
                        } else {
                            deferred.resolve(_.map(res,
                                (props) => new this(_.merge(props,
                                    {_id: props.categoryId}))));
                        }

                        deferred.promise.nodeify(callback);
                    });

                    return deferred.promise;
                }

                // TODO: rename
                // TODO: is it supposed to return array or single object
                // TODO: write doc
                // searchTerm: keyword,
                // {
                //     numContent: number,
                //     displayName: string,
                //     description: string
                // }
                static generateDynamic(searchTerm, options, callback) {
                    let deferred = q.defer();

                    that.api.generateDynamicInsight(searchTerm, options, (err, res) => {
                        if (err) {
                            deferred.reject(JSON.parse(err.message));
                        } else {
                            this.get(res.categoryIds[0], (err, res) => {
                                deferred.resolve(res);
                            });
                        }

                        deferred.promise.nodeify(callback);
                    });

                    return deferred.promise;
                }

                static count(callback) {
                    let deferred = q.defer();

                    that.api.countInsights((err, res) => {
                        if (err) {
                            deferred.reject(JSON.parse(err.message));
                        } else {
                            deferred.resolve(res);
                        }

                        deferred.promise.nodeify(callback);
                    });

                    return deferred.promise;
                }

                toPlainObject() {
                    let toSamplePlainObject = (sample) => {
                        return {
                            contentId: sample.content._id,
                            positive: sample.positive
                        };
                    };

                    // TODO: refactor this
                    let properties = super.toPlainObject();
                    properties.samples = _.map(this.samples.toArray(), toSamplePlainObject);
                    properties.testSamples = _.map(this.testSamples.toArray(), toSamplePlainObject);
                    return properties;
                }
            };

        insightClass.InsightSamples = this.InsightSamplesClass;

        return insightClass;
    }
}

module.exports = InsightFactory;