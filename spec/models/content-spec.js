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

describe('Content Model', () => {
    let content,
        fakeId = '111111111111111111111111';

    beforeEach(() => {

    });

    describe('#get', () => {
        it('found existing content', (done) => {
           Content.get('54ff19deb9c1b433732b2e78', (err, content) => {
               expect(err).toBeNull();
               expect(content.metadata.sourceId).toBe(5);
               expect(content.metadata.source).toBe('Project Gutenberg');
               expect(content.metadata.title).toBe('The United States Constitution');

               done();
           });
        });

        it('returns error when id is not found', (done) => {
            Content.get(fakeId, (err, content) => {
                expect(err.errors).toEqual([ 'Content not found' ]);
                expect(content).toBeUndefined();
                done();
            });
        })
    })
});
