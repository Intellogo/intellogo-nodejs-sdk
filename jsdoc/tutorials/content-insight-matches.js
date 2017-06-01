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
var options = {
    from: 0,
    to: 5,
    minScore: 0.6,
    productionReady: true
};

client.getInsightsMatchingContent({contentId: contentId}, options, (error, insights) => {
    if (error) {
        console.error('Error retrieving matching insights: ', error);
        return;
    }
    insights.forEach((insightMatch) => {
        console.log(`Insight ${insightMatch.category.displayName} scored ${insightMatch.score}`);
    });
});
