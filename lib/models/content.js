'use strict';

const _ = require('lodash'),
    q = require('q'),
    Model = require('./model');

class ContentFactory {

    constructor(api){
        this.api = api;
    }

    Content() {
        let that = this,
            contentClass = class extends Model {
                allowedProperties() { return ['_id']; }
            };

        return contentClass;
    }
}

module.exports = ContentFactory;
