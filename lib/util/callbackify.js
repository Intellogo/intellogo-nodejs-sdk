/**
 * Creates a wrapper for the given function that accepts a callback
 * as its last parameter.
 * When the new function is invoked with a callback, it will call the wrapped
 * function with all provided arguments (except the callback), and will only
 * execute the callback when an 'error' or an 'end' event is emitted
 * The callback will be called with all collected data, or with the error.
 * <br>
 * If no callback is provided, the wrapper will not modify in any way
 * the given function's behaviour.
 * <br><i>In both cases, the returned function will still return the same value
 * as the original function when called.</i>
 * @param {IntellogoFunction} fn The function to wrap
 * @return {IntellogoFunction} The wrapper function
 */
module.exports.callbackify = function (fn) {
    return function () {
        var callback = arguments.length && arguments[arguments.length - 1];
        if (callback && typeof callback === 'function') {
            var intellogoResponse =
                fn.apply(this, arguments.slice(0, arguments.length - 1));
            intellogoResponse.once('error', callback);
            var allData;
            if (intellogoResponse.isIntellogoStream) {
                allData = [];
                intellogoResponse.on('data', (data) => {
                    allData.push(data);
                });
            } else {
                allData = null;
                intellogoResponse.once('data', (data) => {allData = data;});
            }
            intellogoResponse.once('end', () => callback(null, allData));
            return intellogoResponse;
        } else {
            return fn.apply(this, arguments);
        }
    };
};
