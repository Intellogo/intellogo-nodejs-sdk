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
                    if(this._id) {
                        throw Error('update is not implemented');
                        // update
                    } else {
                        let deferred = q.defer();

                        that.api.create(this.toPlainObject(), (err, res) => {
                            if (err) {
                                deferred.reject(JSON.parse(err.message));
                            } else {
                                deferred.resolve(res);
                            }

                            deferred.promise.nodeify(callback);
                        });

                        return deferred.promise;
                    }
                }

                // TODO: implement
                loadSamples(callback){
                    throw Error('loadSamples not implemented');
                }

                // TODO: implement
                saveSamples(callback){
                    throw Error('saveSamples not implemented');
                }
                
                // TODO: this will not be function, it needs to be used like
                // insight.samples.add({}) and insight.samples.remove({})
                samples() {
                    return {
                        add: () => {},
                        remove: () => {}
                    }
                };

                static get(id, callback) {
                    let deferred = q.defer();

                    that.api.getInsightsInfo([id], (err, res) => {
                        if (err) {
                            deferred.reject(JSON.parse(err.message));
                        } else {
                            let props = _.merge(_.get(res, id), {_id: id});

                            deferred.resolve(new this(props));
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
            };

        return insightClass;
    }
}

module.exports = InsightFactory;