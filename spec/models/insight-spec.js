'use strict';

const IntellogoClient = require('../../lib/intellogo-client'),
// TODO: mock IntellogoClient
    clientApi = new IntellogoClient({
        clientId: 'testClientForSDK',
        clientSecret: 'testClientSecretForSDK',
        hostname: 'localhost',
        port: 4444,
        protocol: 'http'
    }),
    Insight = clientApi.classes.Insight,
    InsightSamples = clientApi.classes.InsightSamples,
    Content = clientApi.classes.Content,
    _ = require('lodash');

// TODO: remove this after api is mocked
jasmine.getEnv().defaultTimeoutInterval = 20000;

describe('Insight Model', () => {

    let insight,
        insightProperties = {
            name: 'Object Oriented Programming',
            displayName: 'OOP',
            productionReady: true,
            description: 'Object-oriented programming (OOP) is a programming language model organized around objects rather than "actions" and data rather than logic.',
            tags: ['programming', 'oop'],
            keywords: ['object', 'oriented', 'programming'],
            readonly: false,
            locked: false
        },
        fakeId = '111111111111111111111111',
        metadataOnly = {
            metadata: true,
            samples: false,
            testSamples: false
        },
        fakeId2 = '222222222222222222222222',
        fakeContent = new Content({_id: fakeId});

    beforeEach(() => {
        insight = null;
    });

    afterEach((done) => {
        if (insight && insight._id) {
            insight.remove(done);
        } else {
            done();
        }
    });

    let fail = (done) => {
        return (err) => {
            expect(err).toBeUndefined();
            done();
        };
    };

    it('have constructor', () => {
        insight = new Insight(insightProperties);

        expect(insight.displayName).toBe('OOP');
        expect(insight.name).toBe('Object Oriented Programming');

        insight.samples = new InsightSamples(
            [
                {
                    content: new Content({_id: fakeId}),
                    positive: false
                },
                {
                    content: new Content({_id: fakeId2}),
                    positive: true
                }
            ]
        );

        let array = insight.samples.toArray();

        expect(array.length).toEqual(2);
        expect(array[0]).toEqual(
            {
                content: {_id: fakeId},
                positive: false
            });
        expect(array[1]).toEqual(
            {
                content: {_id: fakeId2},
                positive: true
            });
    });

    it('dont add unwanted properties', () => {
        insight = new Insight({foo: 'bar'});

        expect(insight.foo).toBeUndefined();
    });

    it('works with serialize', () => {
        let plainObject = new Insight(insightProperties).toPlainObject();

        expect(_.keys(plainObject).length).toBe(10);

        expect(plainObject.name).toBe('Object Oriented Programming');
        expect(plainObject.displayName).toBe('OOP');

        expect(plainObject.samples).toEqual([]);
        expect(plainObject.testSamples).toEqual([]);
        console.log(plainObject);
    });

    xit('works with serialize samples', () => {
        let propertiesWithSamples = insightProperties;
        propertiesWithSamples.samples = [
            {content: {_id: '5'}, positive: false},
            {content: {_id: '6'}, positive: false}
        ];

        let plainObject = new Insight(propertiesWithSamples).toPlainObject();

        expect(_.keys(plainObject).length).toBe(10);

        expect(plainObject.name).toBe('Object Oriented Programming');
        expect(plainObject.displayName).toBe('OOP');

        expect(plainObject.samples.length).toEqual(2);
        expect(plainObject.samples).toEqual();
        expect(plainObject.testSamples).toEqual([]);
    });

    describe('#save', () => {
        it('should fail for invalid object', (done) => {
            insight = new Insight({});

            insight.save({}, (err, result) => {
                expect(err.errors.length).toBe(1);
                expect(err.errors[0]).toBe('instance[0] requires property "name"');
                done();
            });
        });

        it('should pass', (done) => {
            insight = new Insight(insightProperties);

            insight.save({}, (err, insight) => {
                expect(err).toBeNull();
                expect(insight.productionReady).toBe(true);
                expect(insight.name).toBe('Object Oriented Programming');
                insight.remove(done);
            });
        });

        it('should pass with samples', (done) => {
            insight = new Insight(insightProperties);
            insight.samples = new InsightSamples(
                [
                    {
                        content: new Content({_id: '54ff19deb9c1b433732b2e76'}),
                        positive: false
                    },
                    {
                        content: new Content({_id: '54ff19deb9c1b433732b2e77'}),
                        positive: true
                    }
                ]
            );

            insight.save()
                .then(insight => Insight.get(insight._id))
                .then(insight => {
                    expect(insight.productionReady).toBe(true);
                    expect(insight.name).toBe('Object Oriented Programming');

                    expect(insight.samples.toArray().length).toBe(2);
                    expect(insight.testSamples.toArray().length).toBe(0);

                    let sample = insight.samples.toArray()[0],
                        content = sample.content;

                    expect(sample.positive).toBe(false);
                    expect(content.metadata.sourceId).toBe(2);
                    expect(content.metadata.source).toBe('Project Gutenberg');
                    expect(content.metadata.title).toBe('United States Bill of Rights');
                    expect(content.metadata.author).toBe('United States');

                    return insight.remove(done);
                })
                .catch(fail(done));
        });
    });

    describe('#update', () => {
        it('should pass', (done) => {
            insight = new Insight(insightProperties);

            insight.save()
                .then(insight => {
                    insight.name = 'new name';
                    return insight.save();
                })
                .then(insight => Insight.get(insight._id))
                .then(insight => {
                    expect(insight.name).toBe('new name');
                    insight.remove(done);
                })
                .catch(fail(done));
        });

        it('should fail for non-existent object', (done) => {
            insight = new Insight(insightProperties);
            insight._id = fakeId;

            insight.save()
                .then(insight => done(insight))
                .catch(err => {
                    expect(err.errors).toEqual(['No such category.']);
                    done();
                });
        });
    });

    describe('#get', () => {
        it('find created object', (done) => {
            insight = new Insight(insightProperties);

            insight.save()
                .then(insight => Insight.get(insight._id))
                .then(insight => {
                    expect(insight.name).toBe('Object Oriented Programming');
                    expect(insight._id).toBeDefined();
                    insight.remove(done);
                });
        });

        it('throws error when id is not systemId', (done) => {
            let insight = Insight.get('not id', (err, result) => {
                expect(err.errors.length).toBe(1);
                expect(err.errors[0]).toBeDefined();
                expect(result).toBeUndefined();
                done();
            });
        });

        it('returns error when id is not systemId', (done) => {
            let insight = Insight.get('not id')
                .catch((err) => {
                    expect(err.errors.length).toBe(1);
                    expect(err.errors[0]).toBeDefined();
                    done();
                });
        });

        it('returns error when id is not found', (done) => {
            let insight = Insight.get(fakeId, (err, result) => {
                expect(err.errors.length).toBe(1);
                expect(err.errors[0]).toBe('Item with id: 111111111111111111111111 not found.');
                expect(result).toBeUndefined();
                done();
            });
        });

        it('find existing object with samples', (done) => {
            Insight.get('54ff19d8b9c1b433732b2df3').then((insight) => {
                expect(insight.name).toBe('Juvenile fiction');
                expect(insight.tags.length).toBe(0);
                expect(insight.productionReady).toBe(false);
                expect(insight.modifiedTime).toBe(1468592018149);

                expect(insight.samples.toArray().length).toBe(778);
                expect(insight.testSamples.toArray().length).toBe(0);

                done();
            }, (err) => {
                // TODO: this is actually undefined, fix it
                fail('Unexpected error', err);
                done();
            });
        });

        it('find existing object without samples', (done) => {
            let insight = Insight.get('54ff19d8b9c1b433732b2df3', {samples: false, testSamples: false});

            insight.then((result) => {
                expect(result.name).toBe('Juvenile fiction');
                expect(result.tags.length).toBe(0);
                expect(result.productionReady).toBe(false);
                expect(result.modifiedTime).toBe(1468592018149);

                expect(insight.samples).toBeUndefined();
                expect(insight.testSamples).toBeUndefined();
                done();
            }, (err) => {
                fail('Unexpected error', err);
                done();
            });
        });

        it('returns error when id is not systemId', (done) => {
            let insight = Insight.get('154ff19d8b9c1b433732b2df3');

            insight.then((result) => {
                fail("Unexpected result", result);
                done();
            }, (err) => {
                expect(err.errors.length).toBe(1);
                expect(err.errors[0]).toBeDefined();
                done();
            });
        });
    });

    describe('#samples', function () {
        it('#should set samples on insight create if given', () => {
            let content = new Content({_id: fakeId}),
                content2 = new Content({_id: fakeId2});

            insight = new Insight({
                samples: [{content: content, positive: true}, {content: content2, positive: true}],
                testSamples: [{content: content, positive: true}]
            });

            expect(insight.samples.get(fakeId)).toEqual({content: content, positive: true});
            expect(insight.samples.get(fakeId2)).toEqual({content: content2, positive: true});
            expect(insight.testSamples.get(fakeId)).toEqual({content: content, positive: true});
        });

        describe('samples altering', function () {
            beforeEach(() => {
                insight = new Insight();
            });

            describe('#add samples', () => {
                it('should add samples', () => {
                    insight.samples.add(new Content({_id: fakeId}), false);
                    insight.testSamples.add(new Content({_id: fakeId}), true);

                    expect(insight.samples.toArray()).toEqual([{
                        content: jasmine.objectContaining({
                            _id: fakeId
                        }),
                        positive: false
                    }]);
                    expect(insight.testSamples.toArray()).toEqual([{
                        content: jasmine.objectContaining({
                            _id: fakeId
                        }),
                        positive: true
                    }]);
                });

                it('should not add duplicates', () => {
                    insight.samples.add(new Content({_id: fakeId}), false);
                    insight.testSamples.add(new Content({_id: fakeId}), true);
                    expect(insight.samples.toArray()).toEqual([{
                        content: jasmine.objectContaining({
                            _id: fakeId
                        }),
                        positive: false
                    }]);
                    expect(insight.testSamples.toArray()).toEqual([{
                        content: jasmine.objectContaining({
                            _id: fakeId
                        }),
                        positive: true
                    }]);
                });

                it('should alter existing content positiveness', () => {
                    insight.samples.add(new Content({_id: fakeId}), true);
                    expect(insight.samples.toArray()).toEqual([{
                        content: jasmine.objectContaining({
                            _id: fakeId
                        }),
                        positive: true
                    }]);
                });

                it('should throw', () => {
                    insight = new Insight();

                    expect(insight.samples.add.bind(null, 'not a content')).toThrow();
                    expect(insight.samples.add.bind(null, new Content(), 'not a boolean')).toThrow();
                });
            });

            it('#get', () => {
                insight = new Insight();
                insight.samples.add(new Content({_id: fakeId}), false);

                expect(insight.samples.get(fakeId))
                    .toEqual({
                        content: jasmine.objectContaining({_id: fakeId}),
                        positive: false
                    });
                expect(insight.samples.get('notExisting'))
                    .toEqual(null);
            });

            it('#overwrite tests', () => {
                insight = new Insight();
                insight.samples = new Insight.InsightSamples([
                    {
                        content: new Content({_id: fakeId}),
                        positive: false
                    }]);

                expect(insight.samples.toArray()).toEqual([{
                    content: new Content({_id: fakeId}),
                    positive: false
                }]);
            });

            it('#toArray', () => {
                insight = new Insight();
                insight.samples.add(new Content({_id: fakeId}), false);
                insight.samples.add(new Content({_id: fakeId2}), true);

                expect(insight.samples.toArray(fakeId))
                    .toEqual([{
                        content: jasmine.objectContaining({_id: fakeId}),
                        positive: false
                    }, {
                        content: jasmine.objectContaining({_id: fakeId2}),
                        positive: true
                    }]);
            });

            it('#remove samples', () => {
                insight = new Insight();
                insight.samples.add(new Content({_id: fakeId}), false);
                insight.testSamples.add(new Content({_id: fakeId}), false);

                insight.samples.remove(fakeId);
                insight.testSamples.remove(fakeId);

                expect(insight.samples.toArray()).toEqual([]);
                expect(insight.testSamples.toArray()).toEqual([]);
            });
        });

        xdescribe('#saveSamples', function () {
            it('#_saveSamples should load samples', (done) => {
                insight = new Insight({
                    testSamples: [{contentId: fakeId, positive: true}]
                });

                insight
                    .save()
                    // Reload insight
                    .then(insight => Insight.get(insight._id))
                    .then(insight => insight._saveSamples())
                    .then(insight => {
                        expect(insight.samples).toEqual([{contentId: fakeId, positive: true}]);
                        done();
                    });
            });

            it('#_saveTestSamples should load testSamples', (done) => {
                insight = new Insight({testSamples :[{contentId: fakeId, positive: true}]});

                insight
                    .save()
                    // Reload insight
                    .then(insight => Insight.get(insight._id))
                    .then(insight => insight._saveTestSamples())
                    .then(insight => {
                        expect(insight.testSamples).toEqual([{contentId: fakeId, positive: true}]);
                        done();
                    });
            });

            it('#loadSamples should load both', (done) => {
                insight = new Insight({
                    testSamples: [{contentId: fakeId, positive: true}],
                    samples: [{contentId: fakeId, positive: false}]
                });

                insight
                    .save()
                    // Reload insight
                    .then(insight => Insight.get(insight._id))
                    .then(insight => insight._populateSamples())
                    .then(insight => {
                        expect(insight.samples).toEqual([{contentId: fakeId, positive: true}]);
                        expect(insight.testSamples).toEqual([{contentId: fakeId, positive: false}]);
                        done();
                    });

            });
        });

        describe('#loadSamples', function () {
            it('should load samples for existing Insight', (done) => {
                new Insight({_id: '54ff19d8b9c1b433732b2df3'})
                    ._loadSamples(false)
                    .then(insight => {

                        expect(insight.name).toBeUndefined();

                        expect(insight.samples.toArray().length).toBe(779);
                        expect(insight.testSamples.toArray().length).toBe(0);

                        done();
                    })
                    .catch(fail(done));
            });

            it('should load samples with callback for existing Insight', (done) => {
                new Insight({_id: '54ff19d8b9c1b433732b2df3'})
                    ._loadSamples(false, (err, insight) => {

                        expect(err).toBeNull();
                        expect(insight.name).toBeUndefined();
                        expect(insight.samples.toArray().length).toBe(779);
                        expect(insight.testSamples.toArray().length).toBe(0);
                        done();
                    });
            });

            it('#_loadTestSamples should load testSamples', (done) => {
                insight = new Insight(insightProperties);
                insight.testSamples = new InsightSamples(
                    [
                        {
                            content: {_id: '54ff19deb9c1b433732b2e76'},
                            positive: true
                        }
                    ]
                );

                insight
                    .save({})
                    .then(insight => {
                        return Insight.get(insight._id, {testSamples: false, samples: false});
                    })
                    .then(insight => {
                        expect(insight.displayName).toBe('OOP');
                        expect(insight.testSamples.toArray()).toEqual([]);
                        return insight._loadTestSamples(true);
                    })
                    .then(insight => {
                        expect(insight.displayName).toBe('OOP');
                        expect(insight.samples.toArray().length).toBe(0);
                        expect(insight.testSamples.toArray().length).toBe(1);

                        let content = insight.testSamples.toArray()[0].content;
                        expect(content.metadata.source).toBe('Project Gutenberg');
                        expect(content.metadata.title).toBe('United States Bill of Rights');
                        expect(content.metadata.author).toBe('United States');

                        done();
                    })
                    .catch(fail(done));
            });

            it('#_loadTestSamples should load both', (done) => {
                insight = new Insight(insightProperties);
                insight.samples = new InsightSamples(
                    [
                        {
                            content: {_id: '54ff19deb9c1b433732b2e76'},
                            positive: true
                        }
                    ]
                );

                insight
                    .save()
                    .then(insight => Insight.get(insight._id))
                    .then(insight => insight._loadSamples(false))
                    .then(insight => {
                        expect(insight.samples.toArray().length).toBe(1);
                        let content = insight.samples.toArray()[0];

                        expect(content.positive).toBe(true);
                        expect(content.content).toEqual({ _id : '54ff19deb9c1b433732b2e76' });
                        expect(insight.testSamples.toArray()).toEqual([]);
                        done();
                    })
                    .catch(fail(done));

            });
        });
    });

    // TODO: rewrite
    describe('#query', () => {
        describe('callback', () => {
            it('returns a list of objects', (done) => {
                Insight.query({searchTerm: 'Science Fiction', status: ['new']}, (err, results) => {
                    expect(err).toBeNull();
                    expect(results.length).toBe(4);

                    let insights = _.sortBy(results, '_id');

                    expect(insights[0].name).toBe('Science fiction');
                    expect(insights[0]._id).toBe('54ff19d8b9c1b433732b2dfb');
                    expect(insights[1].name).toBe('English fiction');
                    expect(insights[1]._id).toBe('54ff19d9b9c1b433732b2e1f');
                    expect(insights[2].name).toBe('Psychological fiction');
                    expect(insights[2]._id).toBe('54ff19d9b9c1b433732b2e30');
                    expect(insights[3].name).toBe('[steve] Action&Adventure Fiction&Non');
                    expect(insights[3]._id).toBe('555da507e54f62372c141d9d');

                    done();
                });
            });

            it('return all categories if searchTerm and status are empty', (done) => {
                Insight.query({}, (err, results) => {
                    expect(err).toBeNull();

                    // TODO: change this with real value when API is mocked
                    expect(results.length).toBeGreaterThan(400);

                    done();
                });
            });

            it('returns empty list when there is no matching criteria', (done) => {
                Insight.query({searchTerm: 'Non existing category', status: ['notStatus']}, (err, results) => {
                    expect(err).toBeNull();
                    expect(results.length).toBe(0);

                    done();
                });
            });
        });

        describe('continuity monad', () => {
            it('returns a list of objects', (done) => {
                let insights = Insight.query({searchTerm: 'Science Fiction', status: ['new']});

                insights.then((results) => {
                    expect(results.length).toBe(4);

                    let categoryNames = _.sortBy(_.map(results, 'name'));

                    expect(categoryNames[0]).toBe('English fiction');
                    expect(categoryNames[1]).toBe('Psychological fiction');
                    expect(categoryNames[2]).toBe('Science fiction');
                    expect(categoryNames[3]).toBe('[steve] Action&Adventure Fiction&Non');

                    done();
                }, (err) => {
                    fail('No error is supposed to be returned', err);
                    done();
                });
            });
        });
    });

    describe('#generateDynamic', () => {
        describe('callback', () => {
            it('returns already created object', (done) => {
                let options = {
                    displayName: 'Psycho Fiction',
                    description: 'test category',
                    numContent: 5
                };

                Insight.generateDynamic('Psychological fiction', options, (err, result) => {
                    expect(err).toBeNull();
                    expect(result.displayName).toBe('Psycho Fiction');
                    done();
                });
            });
        });

        describe('continuity monad', () => {
            it('returns already created object', (done) => {
                let options = {
                    displayName: 'Psycho Fiction',
                    description: 'test category',
                    numContent: 5
                };

                let insight = Insight.generateDynamic('Psychological fiction', options);

                insight.then((result) => {
                    expect(result.displayName).toBe('Psycho Fiction');
                    done();
                });
            });
        });
    });

    describe('#count', () => {
        it('returns categories count', (done) => {
            Insight.count()
                .then((count) => {
                    expect(count).toBe(519);
                    done();
                })
                .catch(err => done(err));
        });
    });
});

