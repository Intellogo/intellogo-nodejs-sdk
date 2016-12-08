'use strict';

var IntellogoClient = require('../../lib/intellogo-client'),
    // TODO: mock IntellogoClient
    api = new IntellogoClient({
        clientId: '<use real>',
        clientSecret: '<change with real>',
        hostname: 'localhost',
        port: 4444,
        protocol: 'http'
    }),
    Factory = require('../../lib/models/factory'),
    factory = new Factory(api),
    Insight = factory.Insight,
    Content = factory.Content,
    SmartCollection = factory.SmartCollection;

describe('Insight Model', () => {
    let insight;

    beforeEach(() => {

    });

    describe('#save', () => {
        it('should fail for invalid object', (done) => {
            insight = new Insight({});

            insight.save((err, result) => {
                let errors = err.errors;

                console.log('errors', errors);

                expect(errors.lenght).toBe(4);
                done();
            });
        });

        it('should pass', (done) => {
            insight = new Insight({
                name: 'Object Oriented Programming',
                displayName: 'OOP',
                productionReady: true,
                description: 'Object-oriented programming (OOP) is a programming language model organized around objects rather than "actions" and data rather than logic.',
                tags: ['programming', 'oop'],
                keywords: ['object', 'oriented', 'programming']
            });

            insight.save((err, result) => {
                expect(err).toBeUndefined();
                done();
            });
        });
    });

    describe('#findById', () => {
        describe('callback', () => {
            it('find created object', (done) => {
                insight = new Insight({
                    name: 'Object Oriented Programming',
                    displayName: 'OOP',
                    productionReady: true,
                    description: 'Object-oriented programming (OOP) is a programming language model organized around objects rather than "actions" and data rather than logic.',
                    tags: ['programming', 'oop'],
                    keywords: ['object', 'oriented', 'programming']
                });

                insight.save((err, result) => {
                    let savedInsight = Insight.get(result.id);

                    done();
                });
            });

            it('find existing object', (done) => {
                Insight.get('54ff19d8b9c1b433732b2df3', (err, result) => {
                    console.log('err', err);

                    expect(result.name).toBe('Juvenile fiction');
                    expect(result.tags.length).toBe(0);
                    expect(result.productionReady).toBe(false);
                    expect(result.modifiedTime).toBe(1468592018149);

                    done();
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
});
