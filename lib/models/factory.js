'use strict';

const InsightFactory = require('./insight'),
      ContentFactory = require('./content'),
      SmartCollectionFactory = require('./smart-collection'),
      SmartCollectionItemsFactory = require('./smart-collection-items');

class Factory {
    constructor(api) {
        this.api = api;

        this.Insight = new InsightFactory(api).Insight();
        this.Content = new ContentFactory(api).Content();
        this.SmartCollection = new SmartCollectionFactory(api).SmartCollection();
        this.SmartCollectionItems = new SmartCollectionItemsFactory(api).SmartCollectionItems();
    }
}

module.exports = Factory;
