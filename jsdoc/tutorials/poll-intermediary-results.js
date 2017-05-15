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
