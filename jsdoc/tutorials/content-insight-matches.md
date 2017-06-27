```
var IntellogoClient = require('intellogo-sdk').IntellogoClient;

var client = new IntellogoClient({
    clientId: '<myClientId>',
    clientSecret: '<myClientSecret>'
});


// Find matching insights for this content
var contentId = '<contentId>';
var options = {
    from: 0,
    to: 5,
    minScore: 0.6, // only match insights in which the content scored higher than 60%
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
```
