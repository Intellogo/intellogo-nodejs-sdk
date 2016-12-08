'use strict';

// TODO: remove this class if there is no common functionality between its successors
class Model {

    constructor(properties) {
        this.properties = properties;
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

    // static query(criteria, callback) {
    //     throw Error('#query not implemented');
    // }
}

module.exports = Model;