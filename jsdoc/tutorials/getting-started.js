var IntellogoClient = require('intellogo-sdk').IntellogoClient;
var async = require('async');
var _= require('lodash');

var client = new IntellogoClient({
    clientId: 'mytest',
    clientSecret: 'mypass',
    hostname: 'localhost',
    port: 4444,
    protocol: 'http'
});
var options = {
    from: 0,
    to: 10,
    contentFilter: {
        source: ['Wikipedia']
    }
};

async.waterfall([
    client.getAllSmartCollections.bind(client),
    function smartCollectionsListReceived(data,callback) {
        var idx = _.random();
        console.log("Loading recommendations for smart collection " +
            data[idx].metadata.name);
        client.getSmartCollectionRecommendations (data[idx]._id, options, callback);
    },
    function smartCollectionResultsReceived(data,callback) {
        console.log("Recommendations:");
        console.log(JSON.stringify(data,null,'\t'));
        callback();
    }
    ],
    function (error)
    {
        console.log(error);
    });
