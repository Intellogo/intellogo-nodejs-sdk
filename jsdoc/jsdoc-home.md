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