In this tutorial we:
* Initiate a task for content recommendations generation on a limited amount of content and wait for it to complete
* Set up a polling mechanism to show filtered intermediary results until the task completes

In order to give recommendations for a given content, Intellogo first needs to generate scores of the content against all other available content in the system. This is done by initiating a content recommendations task (or CvC task for short). The task processes content in batches, so intermediary results might be available before the task completes. However, the best matches are those with the highest score after the task completes, so it is best to wait for the task to finish, to be sure the best matches have been found.

There are two methods that can be used to generate recommendations for a content:
* [Initiate a task without waiting for it to finish](TrainingAPI.html#initiateContentRecommendationGeneration): In this case a task will be initiated and its ID (along with some other status information) will be passed to the callback. You can then manually track the task progress with the [TrainingAPI~getTaskStatus](TrainingAPI.html#getTaskStatus) method.
* [Initiate a task and wait for its completion](TrainingAPI.html#generateContentRecommendations): Calling this method will initiate a task and wait for it to finish before calling the provided callback. In this case you do not need to track the task progress on your own.<br>This method uses the [Notification Service](tutorial-notifications-service.html), if it has been set up, or uses regular polling otherwise.

Both methods accept the same parameters (in fact, the second is a convenience wrapper around the first).

When generating recommendations, we may choose to limit the scope of processed content (to speed up the processing or because we do not care about recommendations from a certain source, e.g. Wikipedia). This is done by using the optional `recommendationsFilters` parameter of [TrainingAPI~generateContentRecommendations](TrainingAPI.html#initiateContentRecommendationGeneration). We demonstrate this in the example below.

After the task has completed, or while it is running, we can retrieve the best recommendations so far. Here we can apply filters on the returned recommendations. Note that these filters can be different than the ones used when initiating the recommendations generation task: The filters applied on the task limit the content for which Intellogo will generate scores, while the filters on recommendations retrieval can be used to e.g. show different subsets of the already calculated recommendations.

The recommendations generation task can be slow (and expensive), so it is best to run it against all relevant content once and then use various filters, instead of starting a separate task every time a different filter is required.


```
var IntellogoClient = require('intellogo-sdk').IntellogoClient;

var client = new IntellogoClient({
    clientId: '<myClientId>',
    clientSecret: '<myClientSecret>'
});

// The content for which we will generate recommendations
var contentId = '<contentId>';

// Only retrieve recommendations matching this filter
// This filter retrieves only the top 10 matches from the web,
// and limits the matches to articles from the past week.
// The acquisitionDate parameter must be in seconds
var lastWeekTimestamp = Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60;
var webRecommendationsFilter = {
    from: 0,
    to: 5, // top five results
    contentFilter: {
        sourceGroup: ['web'],
        acquisitionDate: lastWeekTimestamp
    }
};

// This filter retrieves only the top 10 book matches (e.g. Project Gutenberg)
var bookRecommendationsFilter = {
    from: 0,
    to: 5, // top five results
    contentFilter: {
        sourceGroup: ['books']
    }
};

// This filter determines which parts of Intellogo's content will be scored against the given one
var taskFilters = [{
    sourceGroup: ['web', 'books']
}];

console.log('Initiating task for article', contentId);

var keepPolling = true;
var POLLING_INTERVAL_MS = 5 * 1000; // poll for new results every 5 seconds

// This function polls for two types of results: web matches and book matches.
// After retrieving the relevant results, we check the `keepPolling` flag. If it is still `true`,
// we restart the polling timer.
// When the task completes, the `keepPolling` flag will be set to `false` and the timer won't be restarted.
function pollIntermediaryResults() {
    // First get recommendations from the web
    client.getContentRecommendations(contentId, webRecommendationsFilter, (error, webRecommendations) => {
        console.log('Web ecommenations so far:');
        console.log(webRecommendations.ratings);
        // Now book recommendations
        client.getContentRecommendations(contentId, bookRecommendationsFilter, (error, bookRecommendations) => {
            console.log('Book ecommenations so far:');
            console.log(bookRecommendations.ratings);

            if (keepPolling) {
                setTimeout(pollIntermediaryResults, POLLING_INTERVAL_MS);
            } else {
                console.log('These are the final results');
            }
        });
    });
}

client.generateContentRecommendations({contentId: contentId}, taskFilters, (error) => {
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
