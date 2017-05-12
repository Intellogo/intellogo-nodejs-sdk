In this tutorial we:
* Initiate a task for content recommendations generation and wait for it to complete
* Set up a polling mechanism to show intermediary results until the task completes

```
var IntellogoClient = require('intellogo-sdk').IntellogoClient;

var client = new IntellogoClient({
    clientId: '<myClientId>',
    clientSecret: '<myClientSecret>'
});

// The content for which we will generate recommendations
var contentId = '<contentId>';
var recommendationsFilter = {
    from: 0,
    to: 10, // top ten results
    contentFilter: {
        sourceGroup: ['web']
    }
};

console.log('Initiating task for article', contentId);

var keepPolling = true;
var POLLING_INTERVAL_MS = 5 * 1000; // poll for new results every 5 seconds

function pollIntermediaryResults() {
    client.getContentRecommendations(
        contentId, recommendationsFilter, (error, recommendations) => {
            console.log('Recommenations so far:');
            console.log(recommendations.ratings);
            if (keepPolling) {
                setTimeout(pollIntermediaryResults, POLLING_INTERVAL_MS);
            } else {
                console.log('These are the final results');
            }
        });
}

client.generateContentRecommendations({contentId: contentId}, (error) => {
    keepPolling = false;
    if (error) {
        console.error('Error generating recommendations', error);
    } else {
        console.log('The task has completed successfully');
    }
});

console.log('Setting up polling');
pollIntermediaryResults();
```
