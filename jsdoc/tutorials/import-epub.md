```
const IntellogoClient = require('intellogo-sdk').IntellogoClient;

var client = new IntellogoClient({
    clientId: '<clientId>',
    clientSecret: '<clientSecret>'
});

var epubPath = '/path/to/epub/sample.epub',
    metadata = {
        source: 'Sample Source',
        author: 'Sample Author',
        imageUrl: 'http://<image-url>'
    },
    chunkingOptions = {
        enableChunking: false
    };

function printIndentedTitles(contentTreeRoot) {
    console.log(contentTreeRoot.metadata.title);
    if (contentTreeRoot.children) {
        contentTreeRoot.children.forEach((child) => {
            printIndentedTitles(child);
        });
    }
}

client.importEpub(epubPath, metadata, chunkingOptions, (error, importResult) => {
    if (error || !importResult.success) {
        console.error('error importing', epubPath, error);
        console.error('Import log: ', importResult.log);
        return;
    }

    var importedId = importResult.importSummary[importResult.importSummary.length - 1].contentId;
    // retrieve child content
    client.getContentTree(importedId, (error, contentTree) => {
        if (error) {
            console.error('error retrieving child content: ', error);
            return;
        }
        printIndentedTitles(contentTree);
    });
});
```
