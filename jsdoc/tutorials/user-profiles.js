const IntellogoClient = require('../../lib/intellogo-client');

var client = new IntellogoClient({
    clientId: 'client',
    clientSecret: 'secret',
    hostname: 'localhost',
    port: 4444,
    protocol: 'http'
});

var userProfile = {
    clientReference: 'Science User'
};

client.searchContent('science', {from: 0, to: 100}, (error, content) => {
    var contentIds = content.map((c) => c.contentId);
    userProfile.contents = contentIds;
    client.createUserProfile(userProfile, (error, createdProfile) => {
        console.log('ID of created user profile: ', createdProfile._id);
        client.deleteUserProfile(createdProfile._id, (error, result) => {
            console.log('Deletion result: ', result);
        });
    });
});
