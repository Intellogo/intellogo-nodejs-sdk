'use strict';

var IntellogoClient = require('../../lib/intellogo-client'),
    _ = require('lodash'),
// TODO: mock IntellogoClient
    clientApi = new IntellogoClient({
        clientId: 'testClientForSDK',
        clientSecret: 'testClientSecretForSDK',
        hostname: 'localhost',
        port: 4444,
        protocol: 'http'
    }),
    Factory = require('../../lib/models/factory'),
    factory = new Factory(clientApi),
    Insight = factory.Insight,
    Content = factory.Content,
    SmartCollection = factory.SmartCollection;

// TODO: remove this after api is mocked
jasmine.getEnv().defaultTimeoutInterval = 10000;

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
        fakeId = '111111111111111111111111';

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

    it('have constructor', () => {
        insight = new Insight(insightProperties);

        expect(insight.displayName).toBe('OOP');
        expect(insight.name).toBe('Object Oriented Programming');
    });

    it('dont add unwanted properties', () => {
        insight = new Insight({foo: 'bar'});

        expect(insight.foo).toBeUndefined();
    });

    it('works with serialize', () => {
        let plainObject = new Insight(insightProperties).toPlainObject();

        expect(_.keys(plainObject).length).toBe(8);

        expect(plainObject.name).toBe('Object Oriented Programming');
        expect(plainObject.displayName).toBe('OOP');
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
                .catch(err => done(err));
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
        describe('callback', () => {
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

            it('returns error when id is not systemId', (done) => {
                let insight = Insight.get('not id', (err, result) => {
                    expect(err.errors.length).toBe(1);
                    expect(err.errors[0]).toBe('instance[0] does not conform to the "systemId" format');
                    expect(result).toBeUndefined();
                    done();
                });
            });

            it('returns error when id is not found', (done) => {
                let insight = Insight.get(fakeId, (err, result) => {
                    expect(err.errors.length).toBe(1);
                    expect(err.errors[0]).toBe('Insight(' + fakeId + ') could not be found.');
                    expect(result).toBeUndefined();
                    done();
                });
            });
        });
        describe('continuity monad', () => {
            it('find existing object', (done) => {
                let insight = Insight.get('54ff19d8b9c1b433732b2df3');

                insight.then((result) => {
                    expect(result.name).toBe('Juvenile fiction');
                    expect(result.tags.length).toBe(0);
                    expect(result.productionReady).toBe(false);
                    expect(result.modifiedTime).toBe(1468592018149);

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
                    expect(err.errors[0]).toBe('instance[0] does not conform to the "systemId" format');
                    done();
                });
            });
        });
    });

    xdescribe('#samples', function() {
        it('#should set samples on insight create if given', () => {
            let content = new Content();
            content._id = fakeId;

            insight = new Insight({
                samples: [{content: content, positive: true}],
                testSamples: [{content: content, positive: true}]
            });
            expect(insight.samples.get(fakeId)).toEqual({content: content, positive: true});
            expect(insight.testSamples.get(fakeId)).toEqual({content: content, positive: true});
        });

        ddescribe('samples altering', function() {
            // TODO enforce positive ??
            it('#add samples', () => {
                insight = new Insight();

                // normal add
                insight.samples.add(fakeId, false);
                insight.testSamples.add(fakeId);

                expect(insight.samples.toArray()).toEqual([{
                    contentId: fakeId,
                    positive: false
                }]);
                expect(insight.testSamples.toArray()).toEqual([{
                    contentId: fakeId,
                    positive: true
                }]);

                // duplicates
                insight.samples.add(fakeId, false);
                insight.testSamples.add(fakeId);
                expect(insight.samples.toArray()).toEqual([{
                    contentId: fakeId,
                    positive: false
                }]);
                expect(insight.testSamples.toArray()).toEqual([{
                    contentId: fakeId,
                    positive: true
                }]);

                // changing
                insight.samples.add(fakeId, true);
                expect(insight.samples.toArray()).toEqual([{
                    contentId: fakeId,
                    positive: true
                }]);
            });

            it('#get', () => {
                insight = new Insight();
                insight.samples.add(fakeId, false);

                expect(insight.samples.get(fakeId))
                    .toEqual({contentId: fakeId, positive: false});
                expect(insight.samples.get('notExisting'))
                    .toEqual(null);
            });

            it('#toArray', () => {});

            it('#remove samples', () => {
                insight = new Insight();
                insight.samples.add(fakeId, false);
                insight.testSamples.add(fakeId, false);

                insight.samples.remove(fakeId, false);
                insight.testSamples.remove(fakeId);

                expect(insight.samples.toArray()).toEqual();
                expect(insight.testSamples.toArray()).toEqual();
            });
        });

        describe('#saveSamples', function() {
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
                        console.log('hr4e');
                        expect(insight.samples).toEqual([{contentId: fakeId, positive: true}]);
                        done();
                    });
            });

            it('#_saveTestSamples should load testSamples', (done) => {
                insight = new Insight();
                insight.testSamples = [{contentId: fakeId, positive: true}];

                insight
                    .save()
                    // Reload insight
                    .then(insight => Insight.get(insight._id))
                    .then(insight => insight._saveTestSamples())
                    .then(insight => {
                        console.log('hre');
                        expect(insight.testSamples).toEqual([{contentId: fakeId, positive: true}]);
                        done();
                    });
            });

            it('#loadSamples should load both', (done) => {
                insight = new Insight();
                insight.testSamples = [{contentId: fakeId, positive: true}];
                insight.samples = [{contentId: fakeId, positive: false}];

                insight
                    .save()
                    // Reload insight
                    .then(insight => Insight.get(insight._id))
                    .then(insight => insight._populateSamples())
                    .then(insight => {
                        console.log('hr4e');
                        expect(insight.samples).toEqual([{contentId: fakeId, positive: true}]);
                        expect(insight.testSamples).toEqual([{contentId: fakeId, positive: false}]);
                        done();
                    });

            });
        });

        describe('#loadSamples', function () {
            it('#_loadSamples should load samples', (done) => {
                insight = new Insight({
                    testSamples: [{contentId: fakeId, positive: true}]
                });

                insight
                    .save()
                    // Reload insight
                    .then(insight => Insight.get(insight._id))
                    .then(insight => insight._populateSamples())
                    .then(insight => {
                        console.log('hr4e');
                        expect(insight.samples).toEqual([{contentId: fakeId, positive: true}]);
                        done();
                    });
            });

            it('#_loades should load samples with metadata', (done) => {});

            it('#_loadTestSamples should load testSamples', (done) => {
                insight = new Insight();
                insight.testSamples = [{contentId: fakeId, positive: true}];

                insight
                    .save()
                    // Reload insight
                    .then(insight => Insight.get(insight._id))
                    .then(insight => insight._populateTestSamples())
                    .then(insight => {
                        console.log('hre');
                        expect(insight.testSamples).toEqual([{contentId: fakeId, positive: true}]);
                        done();
                    });
            });

            it('#loadTestSamples should load both', (done) => {
                insight = new Insight();
                insight.testSamples = [{contentId: fakeId, positive: true}];
                insight.samples = [{contentId: fakeId, positive: false}];

                insight
                    .save()
                    // Reload insight
                    .then(insight => Insight.get(insight._id))
                    .then(insight => insight._populateSamples())
                    .then(insight => {
                        console.log('hr4e');
                        expect(insight.samples).toEqual([{contentId: fakeId, positive: true}]);
                        expect(insight.testSamples).toEqual([{contentId: fakeId, positive: false}]);
                        done();
                    });

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
                })
            });

            it('return all categories if searchTerm and status are empty', (done) => {
                Insight.query({}, (err, results) => {
                    expect(err).toBeNull();

                    // TODO: change this with real value when API is mocked
                    expect(results.length).toBeGreaterThan(400);

                    done();
                })
            });

            it('returns empty list when there is no matching criteria', (done) => {
                Insight.query({searchTerm: 'Non existing category', status: ['notStatus']}, (err, results) => {
                    expect(err).toBeNull();
                    expect(results.length).toBe(0);

                    done();
                })
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
                })
            })
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
            })
        });
    });

    describe('#count', () => {
        it('returns categories count', (done) => {
            Insight.count()
                .then((count) => {
                    expect(count).toBe(518);
                    done();
                })
                .catch(err => done(err));
        })
    });
});

