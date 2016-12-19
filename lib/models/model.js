'use strict';

const _ = require('lodash');

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
}

module.exports = Model;