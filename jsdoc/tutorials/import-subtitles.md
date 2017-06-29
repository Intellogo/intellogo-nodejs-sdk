This tutorial shows how to:
* import a .srt file, splitting it into chunks of equal size
* retrieve the metadata of all chunks for the imported subtitles

```
const IntellogoClient = require('intellogo-sdk').IntellogoClient;

var client = new IntellogoClient({
    clientId: '<clientId>',
    clientSecret: '<clientSecret>'
});

var subtitlesPath = '/path/to/srt/sample.srt',
    metadata = {
        source: 'Sample Source',
        sourceId: 'sample_srt',
        title: 'Sample Chunked Title',
        author: 'Sample Author'
    },
    chunkingOptions = {
        chunkingMode: 'length-based',
        chunkSize: 3000
    };

client.importSubtitles(subtitlesPath, metadata, chunkingOptions, (error, importResult) => {
    if (error) {
        console.error('error importing', subtitlesPath, error);
        return;
    }
    if (importResult.error) {
        if (!importResult.existingIds) {
            console.error('error importing ', subtitlesPath, importResult.error);
            return;
        } else {
            // content already exists
            console.log('Existing content: id', importResult.existingIds[0]);
        }
    } else {
        console.log('Successful import');
    }

    var importedId = importResult.id || importResult.existingIds[0];
    // retrieve child content
    client.getContentTree(importedId, (error, contentTree) => {
        if (error) {
            console.error('error retrieving child content: ', error);
            return;
        }
        contentTree.children.forEach((child) => {
            console.log('Child ', child.metadata.title, ' at index ', child.metadata.index);
        });
    });
});
```
