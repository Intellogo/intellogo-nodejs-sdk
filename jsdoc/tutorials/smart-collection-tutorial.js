var IntellogoClient = require('../../lib/intellogo-client');
var client = new IntellogoClient({
    protocol: 'http',
    hostname: 'localhost',
    port: 4444,
    clientId: 'swagger',
    clientSecret: '123456'
});

var Factory = require('../../lib/models/factory'),
    factory = new Factory(client),
    SmartCollection = factory.SmartCollection;

var smartCollection = new SmartCollection({metadata: {name: 'lala'}});
debugger;
