'use strict';
const ErrorsMessages = require('../errors/error-messages'),
    _ = require('lodash');

class InsightSamplesFactory {
    constructor(api) {
        this.classes = api.classes;
    }

    /**
     * Wrapper for map holder
     * TODO find better place (Uses Content model)
     */
    InsightSamples() {
        let that = this,
            InsightSamplesClass = class {
                /**
                 *
                 * @param insightSamples {{content:Content, positive: Boolean}}
                 */
                constructor(insightSamples) {
                    let groupedById = _.zip(_.map(insightSamples, 'content._id'), insightSamples);
                    this.insgihtSamplesMap = new Map(groupedById);
                }

                /**
                 * @param content {Content}
                 * @param positive {Boolean}
                 * @throws
                 */
                add(content, positive) {
                    // TODO use ContentModel
                    if (!content || !(content instanceof that.classes.Content)) {
                        throw new Error(ErrorsMessages.INSIGHT_SAMPLES.INVALID_SAMPLE);
                    }
                    if (!_.isBoolean(positive)) {
                        throw new Error(ErrorsMessages.INSIGHT_SAMPLES.INVALID_POSITIVENESS);
                    }
                    this.insgihtSamplesMap.set(
                        content._id,
                        {
                            content : content,
                            positive: positive
                        });
                }

                remove(contentId) {
                    return this.insgihtSamplesMap.delete(contentId);
                }

                get(contentId) {
                    return this.insgihtSamplesMap.get(contentId);
                }

                toArray() {
                    return Array.from(this.insgihtSamplesMap.values());
                }
            };
        return InsightSamplesClass;
    }
}

module.exports = InsightSamplesFactory;
