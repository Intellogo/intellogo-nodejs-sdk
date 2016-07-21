```
var IntellogoClient = require('../lib/intellogo-client');
var client = new IntellogoClient({
    protocol: 'http',
    hostname: 'localhost',
    port: 4444,
    clientId: 'mytest',
    clientSecret: 'mypass'
});

client.initNotificationsService({hostname:'localhost', port:54321});
client.generateInsightRecommendations('5770e93d845d7d43567e75a5', ['Wikipedia'], null,
                                      (error, done) => {
                                          console.log('ERRROR: ' + error);
                                          console.log('DONE: ', JSON.stringify(done, null, '\t'));
                                          client.stopNotificationsService();
                                      });
```
