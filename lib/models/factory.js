'use strict';

const _ = require('lodash'),
    q = require('q'),
    Model = require('./model');

class Factory {
    constructor(api) {
        this.api = api;
    }

    static Insight(api) {
        let insight = class extends Model {
            constructor(props) {
                super(props);
            }

            static get(id, callback) {
                let deferred = q.defer();

                api.getInsightsInfo([id], (err, res) => {
                    if (err) {
                        deferred.reject(JSON.parse(err.message));
                    } else {
                        deferred.resolve(_.get(res, id));
                    }

                    deferred.promise.nodeify(callback);
                });

                return deferred.promise;
            }
        };

        return insight;
    }
}

module.exports = Factory;