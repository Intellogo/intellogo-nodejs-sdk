In this tutorial, we demonstrate the usage of the notification service through the following steps:
* Initiate the notification service using your public IP
* Choose an insight and a content for which to generate recommendations
* Generate recommendations and wait for the tasks to finish
* Stop the notification service when finished

You can execute steps 2) and 3) without initiating the notification service. In that case,
task progress will be tracked through periodic requests to the Intellogo Service.

```
var async = require('async');
var IntellogoClient = require('intellogo-sdk').IntellogoClient;
var client = new IntellogoClient({
    clientId: '<myClientId>',
    clientSecret: '<myClientSecret>'
});

var keyword = 'sugar';
async.auto({
    connect: client.initNotificationsService.bind(client, {hostname:'<your public IP>',
                                                           port:54321}),
    insightId: function (callback) {
        client.getAllInsights(keyword, 'ready', (error, insights) => {
            callback(error, insights && insights[0] && insights[0].categoryId);
        });
    },
    contentId: function (callback) {
        client.searchContent(keyword, (error, content) => {
            callback(error, content && content[0] && content[0].contentId);
        });
    },
    insightRecommendations: ['connect', 'insightId',
                             function (args, callback) {
                                 console.log('Generating recommendations for insight ' +
                                             args.insightId);
                                 client.generateInsightRecommendations(
                                     args.insightId, ['Wikipedia'], null, callback);
                             }],
    contentRecommendations: ['connect', 'contentId',
                             function (args, callback) {
                                 console.log('Generating recommendations for content ' +
                                             args.contentId);
                                 client.generateContentRecommendations(
                                     {contentId: args.contentId},
                                     callback);
                             }],
    disconnect: ['insightRecommendations', 'contentRecommendations',
                 function (args, callback) {
                     client.stopNotificationsService(callback);
                 }]
},
           (error, results) => {
               if (error) {
                   console.error(error);
               } else {
                   console.log('insight task finished: ',
                               JSON.stringify(results.insightRecommendations, null, '\t'));
                   console.log('\n\n');
                   console.log('content task finished: ',
                               JSON.stringify(results.contentRecommendations, null, '\t'));

               }
           });
```
