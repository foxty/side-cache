"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalMemCacheStore = exports.LocalStorageCacheStore = exports.cacheable = exports.configure = void 0;
var processor_1 = require("./processor");
var serializer_1 = require("./serializer");
var store_1 = require("./store");
Object.defineProperty(exports, "LocalStorageCacheStore", { enumerable: true, get: function () { return store_1.LocalStorageCacheStore; } });
Object.defineProperty(exports, "LocalMemCacheStore", { enumerable: true, get: function () { return store_1.LocalMemCacheStore; } });
var DEFAULT_GLOBAL_OPTS = {
    keyPrefix: 'cacheable',
    enableSignature: false,
    timeToLive: -1,
    cacheStore: new store_1.LocalStorageCacheStore(),
    serializer: new serializer_1.DefaultSerializer(),
};
var GLOBAL_CACHE_OPTS = DEFAULT_GLOBAL_OPTS;
var configure = function (options) {
    if (options === void 0) { options = DEFAULT_GLOBAL_OPTS; }
    GLOBAL_CACHE_OPTS = Object.assign({}, DEFAULT_GLOBAL_OPTS, options);
};
exports.configure = configure;
var cacheable = function (target, cacheKeyBuilder, options) {
    if (cacheKeyBuilder === void 0) { cacheKeyBuilder = function () { return target.name; }; }
    if (options === void 0) { options = {}; }
    var getCacheOptions = function () {
        return Object.assign({}, GLOBAL_CACHE_OPTS, options);
    };
    var getCache = function (cacheKey) {
        var _a = getCacheOptions(), timeToLive = _a.timeToLive, enableSignature = _a.enableSignature, cacheStore = _a.cacheStore, serializer = _a.serializer;
        var processors = (0, processor_1.createProcessors)(enableSignature, timeToLive, cacheStore);
        try {
            var cacheEntry = processors.get(cacheKey);
            return cacheEntry ? serializer.deserialize(cacheEntry.value) : null;
        }
        catch (e) {
            console.warn("Error while get cache for key=" + cacheKey + ".", e);
            processors.remove(cacheKey);
            return null;
        }
    };
    var saveCache = function (cacheKey, value) {
        var _a = getCacheOptions(), timeToLive = _a.timeToLive, enableSignature = _a.enableSignature, cacheStore = _a.cacheStore, serializer = _a.serializer;
        var processors = (0, processor_1.createProcessors)(enableSignature, timeToLive, cacheStore);
        var serializedCacheValue = serializer.serialize(value);
        var cacheEntry = {
            key: cacheKey,
            value: serializedCacheValue
        };
        processors.set(cacheEntry);
    };
    return new Proxy(target, {
        apply: function (target, thisArg, argArray) {
            var keyPrefix = getCacheOptions().keyPrefix;
            var cacheKey = keyPrefix + '.' + cacheKeyBuilder.apply(null, argArray);
            var cachedData = getCache(cacheKey);
            if (cachedData)
                return cachedData;
            var response = target.apply(thisArg, argArray);
            if (response instanceof Promise) {
                response.then(function (data) { saveCache(cacheKey, data); });
                return response;
            }
            else {
                saveCache(cacheKey, response);
                cachedData = response;
                return cachedData;
            }
        }
    });
};
exports.cacheable = cacheable;
//# sourceMappingURL=index.js.map