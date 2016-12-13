'use strict';

const _ = require('lodash'),
    q = require('q'),
    InsightFactory = require('./insight'),
    ContentFactory = require('./content'),
    SmartCollectionFactory = require('./smart-collection');

class Factory {
    constructor(api) {
        this.api = api;

        this.Insight = new InsightFactory(api).Insight();
        this.Content = new ContentFactory(api).Content();
        this.SmartCollection = new SmartCollectionFactory(api, this).SmartCollection();
    }
}

module.exports = Factory;
