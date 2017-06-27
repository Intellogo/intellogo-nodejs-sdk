var IntellogoClient = require('../../lib/intellogo-client');

var client = new IntellogoClient({
    clientId: 'client',
    clientSecret: 'secret',
    hostname: 'localhost',
    port: 4444,
    protocol: 'http'
});

// The content for which we will generate recommendations.
var contentId = '57ac6b5cc5a15e601ab31be1';
var taskOptions = {
    includeLastRated: true,
    includeCurrentTask: true
};

client.getContentRecommendations(contentId, {}, taskOptions, (error, result) => {
    console.log('Last initiated task (might still be running): ', result.task);
    console.log('Last completed task(s): ', result.lastRated);
});
