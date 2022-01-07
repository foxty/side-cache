"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalMemCacheStore = exports.LocalStorageCacheStore = exports.cacheable = exports.configure = void 0;
var processor_1 = require("./processor");
var serializer_1 = require("./serializer");
var store_1 = require("./store");
Object.defineProperty(exports, "LocalStorageCacheStore", { enumerable: true, get: function () { return store_1.LocalStorageCacheStore; } });
Object.defineProperty(exports, "LocalMemCacheStore", { enumerable: true, get: function () { return store_1.LocalMemCacheStore; } });
var IS_IN_BROWSER = typeof window === 'object';
var DEFAULT_GLOBAL_OPTS = {
    keyPrefix: 'cacheable',
    enableSignature: false,
    timeToLive: -1,
    cacheStore: IS_IN_BROWSER ? new store_1.LocalStorageCacheStore() : new store_1.LocalMemCacheStore(),
    serializer: new serializer_1.DefaultSerializer(),
};
var GLOBAL_CACHE_OPTS = DEFAULT_GLOBAL_OPTS;
var configure = function (options) {
    if (options === void 0) { options = DEFAULT_GLOBAL_OPTS; }
    return __awaiter(void 0, void 0, void 0, function () {
        var response, _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!(typeof options.keyPrefix === 'function')) return [3 /*break*/, 4];
                    response = options.keyPrefix.call(options);
                    _a = options;
                    if (!(response instanceof Promise)) return [3 /*break*/, 2];
                    return [4 /*yield*/, response];
                case 1:
                    _b = _c.sent();
                    return [3 /*break*/, 3];
                case 2:
                    _b = response;
                    _c.label = 3;
                case 3:
                    _a.keyPrefix = _b;
                    _c.label = 4;
                case 4:
                    GLOBAL_CACHE_OPTS = Object.assign({}, DEFAULT_GLOBAL_OPTS, options);
                    return [2 /*return*/];
            }
        });
    });
};
exports.configure = configure;
var cacheable = function (target, cacheKeyBuilder, options) {
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
        try {
            processors.set(cacheEntry);
        }
        catch (e) {
            console.warn("Error while set cache for key " + cacheKey);
        }
    };
    return new Proxy(target, {
        apply: function (target, thisArg, argArray) {
            var keyPrefix = getCacheOptions().keyPrefix;
            var keySuffix = typeof cacheKeyBuilder === 'function' ? cacheKeyBuilder.apply(thisArg, argArray) : cacheKeyBuilder;
            var cacheKey = keyPrefix + '.' + keySuffix;
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