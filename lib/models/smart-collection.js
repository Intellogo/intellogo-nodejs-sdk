'use strict';

const _ = require('lodash'),
    q = require('q'),
    Model = require('./model');

class SmartCollectionFactory {

    constructor(api){
        this.api = api;
    }

    SmartCollection() {
        let that = this,
            smartCollectionClass = class extends Model {};

        return smartCollectionClass;
    }
}

module.exports = SmartCollectionFactory;