var IntellogoClient = require('../../lib/intellogo-client');

var client = new IntellogoClient({
    clientId: 'client',
    clientSecret: 'secret',
    hostname: 'localhost',
    port: 4444,
    protocol: 'http'
});

var channelId = 'UCA4GegKl9TRP1j6hY3TJo9w',
    channelUrl = 'https://www.youtube.com/channel/' + channelId,
    importOptions = {
        autoSub: true, // use Youtube's auto-generated captions if there are no user-uploaded
        refreshAll: true, // import all videos from the channel, not just recent ones
        enableCaptionsChunking: false
    },
    retrievalOptions = {
        contentFilter: {
            source: 'Youtube',
            channelId: channelId
        }
    };

client.importChannel(channelUrl, importOptions, (error, result) => {
    if (error) {
        console.error('Error importing channel: ', error);
        return;
    }
    console.log('channel import result: ', result);
    client.searchContent('', /* no search term, we'll be looking for all imported videos */
                         retrievalOptions,
                         (error, results) => {
                             if (error) {
                                 console.error('Error retrieving imported videos: ', error);
                                 return;
                             }
                             console.log('Imported videos: ', results);
                         });
});
