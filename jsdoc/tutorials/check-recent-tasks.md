In this tutorial we retrieve information about the last recommendation generation task for a given contentId.

```
var IntellogoClient = require('intellogo-sdk').IntellogoClient;

var client = new IntellogoClient({
    clientId: '<clientId>',
    clientSecret: '<clientSecret>'
});

// The content for which we will generate recommendations.
var contentId = '<contentId>';
var taskOptions = {
    includeLastRated: true,
    includeCurrentTask: true
};

client.getContentRecommendations(contentId, {}, taskOptions, (error, result) => {
    console.log('Last initiated task (might still be running): ', result.task);
    console.log('Last completed task(s): ', result.lastRated);
});
```
