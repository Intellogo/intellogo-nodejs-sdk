A Node.js wrapper for the <a href="http://intellogo.com">Intellogo</a> REST API.
All source files can be found in our <a href="http://github.com/intellogo/intellogo-nodejs-sdk">GitHub repository</a>.

See our {@tutorial getting-started} tutorial for an example on how to use the API,
or dive into the other tutorials on the right.

## Notes on the Documentation
The main class in this library is the {@link IntellogoClient} class. It includes all mixins described here. All methods in them _should_ be executed on an instance of {@link IntellogoClient}, as shown in the tutorials. The documentation is split in different mixins only to group related functionality. The mixins are not meant to be used directly.

Most methods, unless otherwise specified, accept a callback and also return an object of type {@link IntellogoResponse}.

We will look at the {@link SmartCollectionsAPI#getAllSmartCollections} method as an example. All other methods are documented and work in a similar fashion.

### Working with IntellogoResponse
The documentation for {@link SmartCollectionsAPI#getAllSmartCollections} specifies that the method returns an object of type {@link IntellogoResponse}.<{@link SmartCollectionsAPI~SmartCollection}>. This should be read as:
> The method returns an object of type {@link IntellogoResponse} that inherits from `EventEmitter`. It will emit either:
* one or more 'data' events with an object of type {@link SmartCollectionsAPI~SmartCollection}, followed by an 'end' event, or
* a single 'error' event with the error, in case an error occurs

The caller of the method does not have to pass a callback in this case. To retrieve the results from the API call, the caller should register listeners for the `data`, `end`, and `error` events.
Unfortunately, with this approach it is not clear whether the {@link IntellogoResponse} object will emit one or more 'data' events, i.e. whether the final result is an array, or a single object.

This set up is a bit convoluted. The good news is, the returned `IntellogoResponse` can be ignored and  standard callbacks can be used.

### Working with callbacks
The documentation for {@link SmartCollectionsAPI#getAllSmartCollections} specifies that the method accepts as a last parameter a function of type {@link IntellogoCallback}.&lt;Array.<{@link SmartCollectionsAPI~SmartCollection}>>. This notation just means that the last parameter should be a callback function accepting two arguments: an error and a result object of type Array.<{@link SmartCollectionsAPI~SmartCollection}>. The error object passed to that function will be falsy if no error occurred.

Notice that here the documentation explicitly states if there will be multiple results (an array), or a single result object.

We recommend using callbacks for all method calls with {@link IntellogoClient}. {@link IntellogoResponse} is meant for internal use only.

## Glossary

### Content
A Content is one of the main entities in Intellogo. It represents a piece of text that has been imported into Intellogo through one of the various supported mechanisms (see the methods in {@link ImportAPI}). These can be Wikipedia or other web articles, books, subtitles of videos etc.

Intellogo does not store the full text of content after processing. However, rich metadata is preserved and can be used for search queries and recommendations filtering. At a minimum, a content has a source and sourceId, which specify where the content came from (e.g. Wikipedia, CNN, Youtube), and an identifier of the content within its source (a Wikipedia article ID, the URL to the CNN article or to the Youtube video).<br>
See {@link ContentAPI~ContentMetadata} for details on the stored metadata.

### Content Chunking
This is an experimental feature that can be enabled on content import. Content chunking consists of splitting the text of the imported content into similarly sized pieces, each of which is also imported separately. Each piece contains a reference to its parent content in its metadata.

The purpose of this feature is to enable more in-depth analysis of longer content. If a content is split into chunks, Intellogo can analyse not only the overall tone and topic of the content, but also how they change from the beginning of the text to its end.

### Master (Top-Level) Content
A subset of all Intellogo content.
Top-level content is content that has been split in chapters or chunks. This happens with e-pubs (imported with {@link ImportAPI#importEpub}), as well as with any content that had chunking enabled during import.

When an e-pub is imported in Intellogo, each chapter is separately imported in addition to the whole book. The representation might be more granular, depending on the table of contents. For example, a book might consist of several parts, each of which has multiple chapters. In that case, only the content representing the whole book is considered a top-level entity, although each part will be imported separately as well. In effect, the whole process creates a one or more levels deep hierarchy with the main content at the root.

Articles, when the experimental chunking option is enabled, are split in similar-sized chunks, and each chunk is separately imported. These chunks, together with the entry for the whole article, form a one-level deep hierarchy of content entities.

The hierarchy defined for a top-level content is useful to get a more in-depth look into the text - e.g. how attitudes or topics change from chapter to chapter.

To retrieve top-level content, use {@link ContentAPI~searchTopLevelContent}. To retrieve the hierarchy for a single top-level content, use {@link ContentAPI~getContentTree}.

### Child Content
A content that is a part of a top-level content hierarchy. Such content has additional metadata properties that uniquely determine its position in the hierarchy - `level`, which is at what depth the content is in the hierarchy, and `index`, which positions the content in its parent's children.

### Insight
Insight is another of the main entities in Intellogo. Each insight represents a single topic, attitude, or concept that Intellogo is trained to recognize.

Insights have some metadata associated with them, as well as an insight definition that is used by Intellogo's AI to learn the concept it should represent.

If Intellogo does not already have an Insight for a concept you're interested in, you can create an entity for it and train Intellogo to understand it. Intellogo learns by example - you need to provide it with examples where your concept is present, so that the system can infer the common features. In Intellogo terms, these are called positive samples. Ideally, there should also be negative samples - examples of text where the concept is not present, so that Intellogo learns to better distinguish nuances.
<br>
Each provided sample must be an already imported Intellogo content. For this, create an Insight with descriptive metadata and assign samples to it (see {@link InsightsAPI}), then use the {@link TrainingAPI} to initiate a training.

Alternatively, insights for a given topic can be easily found or created using {@link InsightsAPI#generateDynamicInsight}.

*Note: An alias for an Insight is the term "Category". If you see a reference to e.g. `categoryId`, you can interpret it as `insightId`.*

### Smart Collection


### Recommendations