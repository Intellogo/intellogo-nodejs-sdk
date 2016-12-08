'use strict';

const _ = require('lodash'),
    q = require('q'),
    Model = require('./model');

class InsightFactory {

    constructor(api){
        this.api = api;
    }

    Insight() {
        let that = this,
            insightClass = class extends Model {
                constructor(props) {
                    super(props);
                }

                static get(id, callback) {
                    let deferred = q.defer();

                    that.api.getInsightsInfo([id], (err, res) => {
                        if (err) {
                            deferred.reject(JSON.parse(err.message));
                        } else {
                            deferred.resolve(_.get(res, id));
                        }

                        deferred.promise.nodeify(callback);
                    });

                    return deferred.promise;
                }

                //["new", "forReview", "ready"]
                // will return empty list if 
                static query(searchTerm, status, callback) {
                    let deferred = q.defer();

                    that.api.getAllInsights(searchTerm, status, (err, res) => {
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