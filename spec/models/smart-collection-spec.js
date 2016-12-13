'use strict';
const _ = require('lodash'),
      IntellogoClient = require('../../lib/intellogo-client'),
      api = new IntellogoClient({
          clientId: 'testClientForSDK',
          clientSecret: 'testClientSecretForSDK',
          hostname: 'localhost',
          port: 4444,
          protocol: 'http'
      }),
      Factory = require('../../lib/models/factory'),
      factory = new Factory(api),
      SmartCollection = factory.SmartCollection;

describe('SmartCollection Model', () => {
    describe('#save', () => {
        const metadata = {
            name: 'SDK Test',
            displayName: 'SDK Test',
            productionReady: false,
            autoupdate: false
        }, items = [
            {categoryId: '5579d8cecf8e650a174d4c5f', min: 70, max: 100}
        ];

        it('should create new smart collection', (done) => {
            let smartCollection = new SmartCollection({metadata: metadata, items: items});
            smartCollection.save((error) => {
                expect(error).toBeFalsy();
                expect(smartCollection._id).toBeDefined();
                done();
            });
        });

        xit('should save only the metadata', (done) => {
        });
        xit('should save only items', (done) => {
        });
    });

    describe('#get', () => {
        const nonExistentId = '55cb7ab85f5bb5f2703711b';
        const existingId = '55cb7ab85f5bb5f2703711b6';

        it('should retrieve existing smart collection with promise', (done) => {
            let smartCollectionPromise = SmartCollection.get(existingId);
            smartCollectionPromise.then((smartCollection) => {
                expect(smartCollection._id).toEqual(existingId);
                done();
            }).catch((e) => {
                // fail test even if e is defined
                expect(e).not.toBeDefined();
                expect(e).toBeDefined();
                done(e);
            });
        });

        it('should retrieve existing smart collection with callback', (done) => {
            SmartCollection.get(existingId, (error, smartCollection) => {
                expect(error).toBeFalsy();
                expect(smartCollection._id).toEqual(existingId);
                done();
            });
        });

        it('should fail when smart collection does not exist using promise', (done) => {
            let smartCollectionPromise = SmartCollection.get(nonExistentId);
            smartCollectionPromise.then((smartCollection) => {
                // fail test whether or not smartCollection is defined - then should not be called
                expect(smartCollection).not.toBeDefined();
                expect(smartCollection).toBeDefined();
                done();
            }).catch((e) => {
                expect(e).toBeDefined();
                done();
            });
        });


        it('should fail when smart collection does not exist using callback', (done) => {
            SmartCollection.get(nonExistentId, (error, smartCollection) => {
                expect(error).toBeTruthy();
                expect(smartCollection).not.toBeDefined();
                done();
            });
        });
    });

    describe('#query', () => {
        const insightId = '559962096149361d10d22da1';

        it('should retrieve all smart collections with no filter', (done) => {
            SmartCollection.query({}, (error, allCollections) => {
                expect(error).toBeFalsy();
                expect(allCollections.length).toBeGreaterThan(0);
                done();
            });
        });


        it('should retrieve all smart collections with filter', (done) => {
            SmartCollection.query({insightId: insightId}, (error, allCollections) => {
                expect(error).toBeFalsy();
                expect(allCollections.length).toBeGreaterThan(0);
                allCollections.forEach((smartCollection) => {
                    expect(_.find(smartCollection.items.toAPIArray(), {categoryId: insightId}))
                        .toBeDefined();
                });
                done();
            });
        });

        it('should retrieve all smart collections with no filter', (done) => {
            let promise = SmartCollection.query({});
            promise.then((allCollections) => {
                expect(allCollections.length).toBeGreaterThan(0);
                done();
            }).catch((error) => {
                expect(error).not.toBeDefined();
                expect(error).toBeDefined();
                done();
            });
        });
    });
});
