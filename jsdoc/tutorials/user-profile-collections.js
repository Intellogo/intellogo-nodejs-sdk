const IntellogoClient = require('../../lib/intellogo-client');

var client = new IntellogoClient({
    clientId: 'client',
    clientSecret: 'secret',
    hostname: 'localhost',
    port: 4444,
    protocol: 'http'
});

var userProfileId = '56c4a085d602a58f4c908184',
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
