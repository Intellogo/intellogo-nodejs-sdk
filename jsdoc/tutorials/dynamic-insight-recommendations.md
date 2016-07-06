```
var IntellogoClient = require('intellogo-nodejs-sdk').IntellogoClient;
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

var client = new IntellogoClient({
    clientId: '<myClientId>',
    clientSecret: '<myClientSecret>'
});

var options = {
    from: 0,
    to: 10,
    contentFilter: {
        sourceGroup: ['web']
    }
};

client.generateDynamicInsight('sugar', (error, result) => {
    if (error) {
        console.error('Error generating a dynamic insight: ' + error);
        return;
    }
    var sugarInsightId = result.categoryIds[0];
    client.initiateInsightTraining(sugarInsightId, (error, done) => {
        if (error) {
            console.error('Error initiating a training task: ' + error);
            return;
        }
        client.pollTaskStatus(done.taskId, (error) => {
            if (error) {
                console.error('Error during insight training: ' + error);
                return;
            }
            console.log('Task done!');
            client.getInsightRecommendations(
                sugarInsightId, options,
                (error, finalResults) => {
                    console.log('Recommendations for sugar:');
                    console.log(finalResults);
                });
        });
    });
});
```