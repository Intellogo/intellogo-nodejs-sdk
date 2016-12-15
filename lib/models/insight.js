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

//TODO better name
// kkirilov: I like the idea, will we able to implement it?
//jshint maxparams: 5
function modelMethodResponse(modifiable,
                             modifier,
                             resolve,
                             reject,
                             callback) {
    return (err, res) => {
        if (err) {
            reject(err);
        } else if (!res || _.isEmpty(res)) {
            // TODO improve message with modifiable class
            reject(ErrorsMessages.GENERAL.NOT_FOUND.format(modifiable._id));
        }
        else {
            // TODO there should be a better way ... checker -> modifiable -> resolve?
            err = modifier(modifiable, res);
            if (err) {
                reject(err);
            } else {
                resolve(modifiable);
            }
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
                    properties = properties? properties: {};
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
                    let defaultOptions = {
                        metadata   : true,
                        samples    : {metadata: true},
                        testSamples: {metadata: true}
                    };

                    let getMetadata = (callback) => {
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
                                    deferred.reject({
                                                        errors: ['Insight(' +
                                                                 this._id +
                                                                 ') could not be found.']
                                                    });
                                }
                            }

                            if (_.isFunction(options)) {
                                deferred.promise.nodeify(options);
                            } else {
                                deferred.promise.nodeify(callback);
                            }
                        });

                        return deferred.promise;
                    };

                    let getSamples = () => {};

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

                _loadSamples(metadata, callback) {
                    let insight = this;
                    return new Promise((resolve, reject) => {
                        that.api.getInsightsSamples(
                            [{
                                metadata: !!metadata,
                                categoryId: insight._id
                            }],
                            modelMethodResponse(
                                insight,
                                (insight, insightArr) => {
                                    if (insightArr && insightArr[0] === null) {
                                        return ErrorsMessages.GENERAL.NOT_FOUND.format(insight._id);
                                    }
                                    insight.samples = new that.InsightSamplesClass(
                                        _.map(insightArr[0].samples,
                                              (sample) => new that.api.classes.Content(sample)));
                                },
                                resolve,
                                reject,
                                callback));
                    });
                }

                _loadTestSamples(metadata, callback) {
                    let insight = this;

                    return new Promise((resolve, reject) => {
                        that.api.getInsightsTestSamples(
                            [{
                                metadata: !!metadata,
                                categoryId: insight._id
                            }],
                            modelMethodResponse(
                                insight,
                                (insight, insightArr) => {
                                    insight.testSamples = new that.InsightSamplesClass(
                                        insightArr.length &&
                                        insightArr[0].testSamples);
                                },
                                resolve,
                                reject,
                                callback,
                                (insightArr) => {
                                    if (insightArr && insightArr[0] === null) {
                                        return ErrorsMessages.GENERAL.NOT_FOUND.format(insight._id);
                                    }
                                    insight.testSamples = new that.InsightSamplesClass(
                                        _.map(insightArr[0].testSamples,
                                              (sample) => new that.api.classes.Content(sample)));
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

        insightClass.InsightSamples = this.InsightSamplesClass;

        return insightClass;
    }
}

module.exports = InsightFactory;