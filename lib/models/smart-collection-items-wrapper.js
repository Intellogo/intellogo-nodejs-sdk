'use strict';

const _ = require('lodash');

class SmartCollectionItemsWrapper {
    constructor(items, owner) {
        this._items = _.cloneDeep(items);
        this._owner = owner;
    }

    static fromAPIArray(rawItems, owner) {
        let items = _.chain(rawItems)
            .map((item) => {
                if (item.categoryId) {
                    return {
                        item: new owner._factory.Insight({_id: item.categoryId}),
                        min: item.min,
                        max: item.max
                    };
                } else if (item.contentId) {
                    return {
                        item: new owner._factory.Content({_id: item.contentId}),
                        min: item.min,
                        max: item.max
                    };
                } else {
                    // unrecognized, ignore
                    return null;
                }
            })
            .compact()
            .value();

        return new SmartCollectionItemsWrapper(items, owner);
    }

    toArray() {
        return _.cloneDeep(this._items);
    }

    toAPIArray() {
        return _.chain(this._items)
            .map((item) => {
                if (item.item instanceof this._owner._factory.Insight) {
                    return {
                        categoryId: item.item._id,
                        min: item.min,
                        max: item.max
                    };
                } else if (item.item instanceof this._owner._factory.Content) {
                    return {
                        contentId: item.item._id,
                        min: item.min,
                        max: item.max
                    };
                } else {
                    return null;
                }
            })
        .compact()
        .value();
    }

    /**
     * @param {Object} item Item to assign to the smart collection. It will be added
     * to the end of the smart collection definition.
     * @param {Content|Insight} item.item The actual item to assign. Must be a valid insight
     * or content, i.e. it must have a valid _id.
     * If the specified item does not satisfy the above requirement, it will be ignored on save.
     * @param {Integer} item.min The lower bound for matching recommendations
     * @param {Integer} item.max The upper bound for matching recommendations
     */
    add(item) {
        this._items.push(item);
    }

    save(callback) {
        this._owner.save({items: true}, callback);
    }
}

module.exports = SmartCollectionItemsWrapper;
