```
var IntellogoClient = require('intellogo-nodejs-sdk').IntellogoClient;
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

var client = new IntellogoClient({
    clientId: '<myClientId>',
    clientSecret: '<myClientSecret>'
});
var options = {
    from: 0,
    to: 10,
    contentFilter: {
        source: ['Wikipedia']
    }
};

client.getSmartCollectionRecommendations(
    '<smartFolderId>', options, (error, data) => {
        if (error) {
            console.error(error);
        } else {
            console.log('Recommendations received: ');
            console.log(data.items);
        }
    });
```
