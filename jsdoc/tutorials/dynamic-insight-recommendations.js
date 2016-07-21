var IntellogoClient = require('intellogo-sdk').IntellogoClient;

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
        sourceGroup: ['web']
    }
};

var keyword = 'sugar';

client.generateDynamicInsight(keyword, (error, result) => {
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
