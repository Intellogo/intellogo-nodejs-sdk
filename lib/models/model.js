'use strict';

const _ = require('lodash');

// TODO: remove this class if there is no common functionality between its successors
class Model {
    constructor(properties) {
        _.forEach(properties, (value, key) => {
            if (_.includes(this.allowedProperties(), key)) {
                this[key] = value;
            } else {
                console.log(key, value, 'is forbidden');
            }

        });
    }

    save(callback) {
        throw Error('#save not implemented');
    }

    static get(id, callback) {
        throw Error('#get not implemented');
    }

    remove(callback) {
        throw Error('#remove not implemented');
    }

    /**
     * @alias remove
     * @return {*}
     */
    delete() {return this.remove.apply(this, arguments);}

    static query(options, callback) {
        throw Error('#query not implemented');
    }

    static count(callback) {
        throw Error('#count not implemented');
    }

    allowedProperties() {
        throw Error('#allowedProperties not implemented')
    }

    toPlainObject() {
        return _.pick(this, this.allowedProperties());
    }
}

module.exports = Model;