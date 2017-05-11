In this tutorial, we:
* Import an article in Intellogo's system
* Handle the basic cases for the import result
* Start a recommendations generation task for the newly imported article
* Retrieve the generated recommendations after the task completes

```
var IntellogoClient = require('intellogo-sdk').IntellogoClient;

var client = new IntellogoClient({
    clientId: '<myClientId>',
    clientSecret: '<myClientSecret>'
});

var url = 'https://medium.com/intellogo/deep-sentiment-analysis-7e2ef6baa0',
    metadata = {
        source: 'Intellogo Site',
        imageUrl: 'https://cdn-images-1.medium.com/max/800/1*vgAdVmZaKn-4wt4YoM1zhw.png'
    },
    recommendationsFilter = {
        from: 0,
        to: 10, // top ten results
        contentFilter: {
            sourceGroup: ['web']
        }
    };

client.importArticle(url, metadata, (error, importResult) => {
    if (error) {
        // might happen e.g. on bad credentials
        console.error('Error on API call: ', error);
    } else {
        var importedId;
        if (importResult.success) {
            console.log('Article successfully imported');
            importedId = importResult.id;
        } else {
            console.error('Error importing article: ', importResult);
            if (importResult.existingIds) {
                // The article import failed because the article already exists
                // We can use the existing ID to get recommendations
                importedId = importResult.existingIds[0];
            }
        }
        if (importedId) {
            // We have an ID, let's initiate a CvC task
            console.log('Initiating task for article', importedId);
            client.generateContentRecommendations({contentId: importedId}, (error) => {
                if (error) {
                    console.error('Error generating recommendations', error);
                } else {
                    console.log('Retrieving recommendations for article', url);
                    // The task has completed, let's retrieve the generated recommendations
                    client.getContentRecommendations(
                        importedId, recommendationsFilter, (error, recommendations) => {
                            if (error) {
                                console.error('Error retrieving recommendations', error);
                            } else {
                                console.log('Received recommendations for', url);
                                console.log(recommendations);
                            }
                        });
                }
            });
        }
    }
});
```