'use strict';

const q = require('q'),
      Model = require('./model');

class SmartCollectionFactory {

    constructor(api){
        this.api = api;
    }

    SmartCollection() {
        let that = this,
            smartCollectionClass = class extends Model {
                static get(id, callback) {
                    let smartCollectionPromise = new Promise((resolve, reject) => {
                        that.api.getSmartCollectionsInfo([id], (error, smartCollections) => {
                            if (error || !smartCollections.length) {
                                reject(error || 'Smart collection does not exist');
                            } else {
                                resolve(smartCollections[0]);
                            }
                        });
                    });
                    if (callback) {
                        q.nodeify(smartCollectionPromise, callback);
                    }
                    return smartCollectionPromise;
                }
            };

        return smartCollectionClass;
    }
}

module.exports = SmartCollectionFactory;
