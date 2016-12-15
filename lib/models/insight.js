'use strict';

const _ = require('lodash'),
    q = require('q'),
    async = require('async'),
    Model = require('./model');

//TODO
// kkirilov: I like the idea, will we able to implement it?
function modelMethodResponse(resolve, reject, callback, modifier) {
    return (err, res) => {
        if (err) {
            reject(JSON.parse(err.message));
        } else {
            modifier(res);
            resolve(this);
        }

        if (_.isFunction(callback)) {
            if(err) {
                callback(JSON.parse(err.message), this);
            } else {
                callback(null, this);
            }
        }
    };
}

/**
 * Wrapper for map holder
 */
class InsightSamples {
    constructor(samples) {
        this.insgihtSamplesMap = new Map(_.zip(_.map(samples, '_id'), samples));
    }

    /**
     *
     * @param content {Content}
     * @param positive
     * @return {Map.<K, V>}
     */
    add(content, positive) {
        return this.insgihtSamplesMap.set(
            content._id,
            {
                content : content,
                positive: positive
            });
    }

    remove(content) {
        return this.insgihtSamplesMap.remove(content._id);
    }

    get(contentId) {
        return this.insgihtSamplesMap.get(contentId);
    }

    toArray() {
        return Array.from(this.insgihtSamplesMap.values());
    }
}

class InsightFactory {

    constructor(api) {
        this.api = api;
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
                    super(properties);
                    this.samples = new InsightSamples(properties.samples);
                    this.testSamples = new InsightSamples(properties.testSamples);
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
                        'readonly'
                    ];
                }

                save(options, callback) {
                    if (this._id) {
                        // update
                        let deferred = q.defer();
                        let update = _.merge(this.toPlainObject(), {categoryId: this._id});

                        that.api.updateInsight(update, (err, res) => {
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

                        that.api.createInsight(this.toPlainObject(), (err, res) => {
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

                load(options, callback) {
                    let deferred = q.defer();

                    let tasks = [
                        (callback) => {
                            process.nextTick(() => {
                                callback(null, this);
                            });
                        }
                    ];

                    if(_.get(options, 'metadata') !== false) {
                        tasks.push(this._loadMetadata.bind(this));
                    }
                    if(_.get(options, 'samples') !== false) {
                        tasks.push(this._loadSamples.bind(this));
                    }
                    if(_.get(options, 'testSamples') !== false) {
                        tasks.push(this._loadTestSamples.bind(this));
                    }

                    async.parallel(
                        tasks,
                        (err, insights) => {
                            if (err) {
                                deferred.reject(err);
                            } else {
                                deferred.resolve(insights[0])
                            }
                            deferred.promise.nodeify(callback);
                        }
                    );

                    return deferred.promise;
                }

                remove(callback) {
                    let deferred = q.defer();

                    that.api.deleteInsight(this._id, (err, res) => {
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
                                deferred.reject({errors: ['Insight(' + this._id + ') could not be found.']});
                            }
                        }
                        deferred.promise.nodeify(callback);
                    });

                    return deferred.promise;
                }

                _loadSamples(callback) {
                    let insight = this;
                    return new Promise((resolve, reject) => {
                        that.api.getInsightsSamples(
                            [{
                                metadata: false,
                                categoryId: insight._id
                            }],
                            (insightArr) => {
                                insight.samples =
                                    insightArr.length &&
                                    insightArr[0].samples;
                            },
                            modelMethodResponse(resolve, reject, callback,
                                (insightArr) => {
                                    insight.samples = insightArr.length && _.get(insightArr[0], 'samples');
                                }));
                    });
                }

                _loadTestSamples(callback) {
                    let insight = this;

                    return new Promise((resolve, reject) => {
                        that.api.getInsightsTestSamples(
                            [{
                                metadata: false,
                                categoryId: insight._id
                            }],
                            (insightArr) => {
                                insight.testSamples =
                                    insightArr.length &&
                                    insightArr[0].testSamples;
                            },
                            modelMethodResponse(
                                resolve,
                                reject,
                                callback,
                                (insightArr) => {
                                    insight.testSamples =
                                        insightArr.length &&
                                        _.get(insightArr[0], 'testSamples');
                                }));
                    });
                }

                // TODO: implement
                _saveSamples(callback) {
                }

                _saveTestSamples(callback) {
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
            };

        return insightClass;
    }
}

module.exports = InsightFactory;