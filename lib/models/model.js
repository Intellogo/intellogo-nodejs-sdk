'use strict';

const _ = require('lodash'),
    ErrorsMessages = require('../errors/error-messages');

// TODO: remove this class if there is no common functionality between its successors
class Model {
    constructor(properties) {
        this.assignProperties(properties);
    }

    assignProperties(properties) {
        _.forEach(properties, (value, key) => {
            if (_.includes(this.allowedProperties(), key)) {
                this[key] = value;
            } else {
                console.log(key, value, 'is forbidden');
            }

        });
    }

    save(options, callback) {
        throw Error('#save not implemented');
    }

    static get(id, options, callback) {
        throw Error('#get not implemented');
    }

    remove(callback) {
        throw Error('#remove not implemented');
    }

    load(options, callback) {
        throw Error('#load not implemented');
    }

    /**
     * @alias remove
     * @return {*}
     */
    delete() {return this.remove.apply(this, arguments);}

    /**
     * @alias load
     * @return {*}
     */
    reload() {return this.load.apply(this, arguments);}

    static query(options, callback) {
        throw Error('#query not implemented');
    }

    static count(callback) {
        throw Error('#count not implemented');
    }

    allowedProperties() {
        throw Error('#allowedProperties not implemented');
    }

    toPlainObject() {
        return _.pick(this, this.allowedProperties());
    }

    //TODO: rename
    modelMethodResponse(transformationCallback, resolve, reject, resultCallback) {
        // TODO: bad name
        let callCallback = (err) => {
            if (_.isFunction(resultCallback)) {
                if (err) {
                    if (err.message) {
                        let errors = JSON.parse(err.message);
                        resultCallback(errors);
                    } else {
                        let errors = {errors: [err]};
                        resultCallback(errors);
                    }

                } else {
                    resultCallback(null, this);
                }
            }
        };
        let rejectOrResolve = (err, res) => {
            if (err) {
                reject(err);
            } else if (!res || _.isEmpty(res)) {
                reject(ErrorsMessages.GENERAL.NOT_FOUND.format(this._id));
            }
            else {
                err = transformationCallback(this, res);
                if (err) {
                    reject(err);
                } else {
                    resolve(this);
                }
            }
        };

        return (err, res) => {
            rejectOrResolve(err, res);
            callCallback(err);
        };
    }
}

module.exports = Model;