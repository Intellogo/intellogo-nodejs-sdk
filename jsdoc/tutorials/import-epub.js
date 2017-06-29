const IntellogoClient = require('../../lib/intellogo-client');

var client = new IntellogoClient({
    clientId: 'client',
    clientSecret: 'secret',
    hostname: 'localhost',
    port: 4444,
    protocol: 'http'
});

var epubPath = '/home/astea/Downloads/Chicken Soup for the Soul_ The - Amy Newmark.epub',
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
