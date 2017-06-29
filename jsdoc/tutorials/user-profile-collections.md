In this tutorial we:
* Retrieve insight combinations for a specific user profile
* Define smart collection items from the top combination and use them to get web article recommendations matching the profile

```
const IntellogoClient = require('intellogo-sdk').IntellogoClient;

var client = new IntellogoClient({
    clientId: '<clientId>',
    clientSecret: '<clientSecret>'
});

var userProfileId = '<profileId>',
    // find combinations that have between 2 and 4 insights,
    //and match at least 5% of the profile's content entries
    combinationsParams = {
        combinationCategoriesMin: 2,
        combinationCategoriesMax: 4,
        combinationContentsMinPercent: 0.05,
        from: 0,
        to: 5
    },
    recommendationsOptions = {
        from: 0,
        to: 10,
        contentFilter: {
            sourceGroup: ['web']
        }
    };

client.getUserProfileInsightCombinations(
    userProfileId, combinationsParams, (error, combinations) => {
        console.log(combinations);
        var bestCombination = combinations[0];
        var profileSmartCollection = bestCombination.categories.map((categoryId) => {
            return {
                id: categoryId,
                min: 70,
                max: 100
            };
        });
        console.log(profileSmartCollection);
        client.getDynamicCollectionRecommendations(
            profileSmartCollection, recommendationsOptions, (error, recommendations) => {
                console.log('Top ten web articles for this profile:');
                recommendations.items.forEach((recommendation) => {
                    console.log(recommendation.metadata.title);
                });
            });
    });
```