'use strict';

const _ = require('lodash');

class MetadataWrapper {
    constructor(metadata, owner) {
        this._allowedProperties = owner.allowedMetadataProperties();
        _.merge(this, _.pick(metadata, this._allowedProperties));
        this._owner = owner;
    }

    toPlainObject() {
        return _.pick(this, this.allowedProperties);
    }

    save(callback) {
        return this._owner.save({metadata: true}, callback);
    }
}

module.exports = MetadataWrapper;
