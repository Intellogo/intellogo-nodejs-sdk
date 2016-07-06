```
var IntellogoClient = require('intellogo-nodejs-sdk').IntellogoClient;
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

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
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
