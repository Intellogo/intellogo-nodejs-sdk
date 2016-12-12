'use strict';

const _ = require('lodash'),
    q = require('q'),
    Model = require('./model');

class InsightFactory {

    constructor(api) {
        this.api = api;
    }

    Insight() {
        let that = this,
            insightClass = class extends Model {
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
                };

                save(callback) {
                    if (this._id) {
                        // update
                        let deferred = q.defer();
                        let update = _.merge(this.toPlainObject(), {categoryId: this._id});

                        that.api.updateInsight(update, (err, res) => {
                            if (err) {
                                deferred.reject(JSON.parse(err.message));
                            } else {
                                if(res[0].success) {
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

                // TODO: implement
                loadSamples(callback) {
                    throw Error('loadSamples not implemented');
                }

                // TODO: implement
                saveSamples(callback) {
                    throw Error('saveSamples not implemented');
                }

                // TODO: this will not be function, it needs to be used like
                // insight.samples.add({}) and insight.samples.remove({})
                samples() {
                    return {
                        add: () => {
                        },
                        remove: () => {
                        }
                    }
                };

                static get(id, callback) {
                    let deferred = q.defer();

                    that.api.getInsightsInfo([id], (err, res) => {
                        if (err) {
                            deferred.reject(JSON.parse(err.message));
                        } else {
                            let found = _.get(res, id);
                            if(found) {
                                let props = _.merge(found, {_id: id});
                                deferred.resolve(new this(props));
                            } else {
                                deferred.reject({errors: ['Insight(' + id + ') could not be found.']});
                            }
                        }

                        deferred.promise.nodeify(callback);
                    });

                    return deferred.promise;
                }

                //TODO: write doc
                //{status: ["new", "forReview", "ready"], searchTerm: 'string'}
                static query(options, callback) {
                    let deferred = q.defer();

                    that.api.getAllInsights(options.searchTerm, options.status, (err, res) => {
                        if (err) {
                            deferred.reject(JSON.parse(err.message));
                        } else {
                            deferred.resolve(_.map(res, (props) => new this(_.merge(props, {_id: props.categoryId}))));
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