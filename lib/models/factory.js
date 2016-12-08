'use strict';

const _ = require('lodash'),
    q = require('q'),
    InsightWrapper = require('./insight'),
    ContentWrapper = require('./content'),
    SmartCollectionWrapper = require('./smart-collection');

class Factory {
    constructor(api) {
        this.api = api;

        this.Insight = new InsightWrapper(api).Insight();
        this.Content = new ContentWrapper(api).Content();
        this.SmartCollection = new SmartCollectionWrapper(api).SmartCollection();
    }
}

module.exports = Factory;