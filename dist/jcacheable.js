var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
define("store", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LocalStorageCacheStore = exports.LocalMemCacheStore = void 0;
    var LocalStorageCacheStore = /** @class */ (function () {
        function LocalStorageCacheStore() {
        }
        LocalStorageCacheStore.prototype.setItem = function (key, value) {
            localStorage.setItem(key, value);
        };
        LocalStorageCacheStore.prototype.getItem = function (key) {
            return localStorage.getItem(key);
        };
        LocalStorageCacheStore.prototype.removeItem = function (key) {
            localStorage.removeItem(key);
        };
        return LocalStorageCacheStore;
    }());
    exports.LocalStorageCacheStore = LocalStorageCacheStore;
    var LocalMemCacheStore = /** @class */ (function () {
        function LocalMemCacheStore() {
            this.store = new Map();
        }
        LocalMemCacheStore.prototype.setItem = function (key, value) {
            this.store.set(key, value);
        };
        LocalMemCacheStore.prototype.getItem = function (key) {
            return this.store.get(key);
        };
        LocalMemCacheStore.prototype.removeItem = function (key) {
            this.store.delete(key);
        };
        return LocalMemCacheStore;
    }());
    exports.LocalMemCacheStore = LocalMemCacheStore;
});
define("processor", ["require", "exports", "luxon", "crypto"], function (require, exports, luxon_1, crypto_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createProcessors = exports.StoreProcessor = exports.ExpirationProcessor = exports.SignatureProcessor = exports.BaseCachePocessor = void 0;
    var BaseCachePocessor = /** @class */ (function () {
        function BaseCachePocessor() {
            this.nextProcessor = null;
        }
        BaseCachePocessor.prototype.cloneEntry = function (cacheEntry) {
            var clonedEntry = {
                key: cacheEntry.key,
                value: cacheEntry.value,
                metadata: Object.assign({}, cacheEntry.metadata)
            };
            return clonedEntry;
        };
        BaseCachePocessor.prototype.next = function (processor) {
            this.nextProcessor = processor;
            return this;
        };
        BaseCachePocessor.prototype.set = function (cacheEntry) {
            var clonedEntry = this.cloneEntry(cacheEntry);
            cacheEntry = this.preSet(clonedEntry);
            this.nextProcessor && this.nextProcessor.set(clonedEntry);
        };
        BaseCachePocessor.prototype.get = function (key) {
            var cacheEntry = this.nextProcessor ? this.nextProcessor.get(key) : null;
            return cacheEntry ? this.postGet(key, this.cloneEntry(cacheEntry)) : null;
        };
        BaseCachePocessor.prototype.remove = function (key) {
            this.nextProcessor && this.nextProcessor.remove(key);
        };
        return BaseCachePocessor;
    }());
    exports.BaseCachePocessor = BaseCachePocessor;
    var SignatureProcessor = /** @class */ (function (_super) {
        __extends(SignatureProcessor, _super);
        function SignatureProcessor() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        SignatureProcessor.prototype.createSignature = function (content) {
            return (0, crypto_1.createHash)('sha256').update(content).digest('hex');
        };
        SignatureProcessor.prototype.verifySignature = function (content, signature) {
            return (0, crypto_1.createHash)('sha256').update(content).digest('hex') === signature;
        };
        SignatureProcessor.prototype.preSet = function (entry) {
            var signature = this.createSignature(entry.value);
            entry.metadata[SignatureProcessor.SIGNATURE_KEY] = signature;
            return entry;
        };
        SignatureProcessor.prototype.postGet = function (key, entry) {
            var signature = entry.metadata[SignatureProcessor.SIGNATURE_KEY];
            var invalidSignature = !this.verifySignature(entry.value, signature);
            if (invalidSignature)
                throw new Error("Invalid signature " + signature + " of " + key);
            return entry;
        };
        SignatureProcessor.SIGNATURE_KEY = 'signature';
        return SignatureProcessor;
    }(BaseCachePocessor));
    exports.SignatureProcessor = SignatureProcessor;
    var ExpirationProcessor = /** @class */ (function (_super) {
        __extends(ExpirationProcessor, _super);
        function ExpirationProcessor(lifetime) {
            var _this = _super.call(this) || this;
            _this.lifetime = lifetime;
            return _this;
        }
        ExpirationProcessor.prototype.preSet = function (cacheEntry) {
            cacheEntry.metadata[ExpirationProcessor.EXPIRE_AT] = this.lifetime >= 0 ? luxon_1.DateTime.now().plus({ second: this.lifetime }).toSeconds() : -1;
            cacheEntry.metadata[ExpirationProcessor.CREATE_AT] = luxon_1.DateTime.now().toSeconds();
            return cacheEntry;
        };
        ExpirationProcessor.prototype.postGet = function (key, cacheEntry) {
            var expireAt = cacheEntry.metadata[ExpirationProcessor.EXPIRE_AT] || -1;
            var createAt = cacheEntry.metadata[ExpirationProcessor.CREATE_AT] || -1;
            if (expireAt > 0 && expireAt < luxon_1.DateTime.now().toSeconds())
                throw new Error("Cache " + key + " expired: expireAt=" + expireAt + ", createAt=" + createAt);
            return cacheEntry;
        };
        ExpirationProcessor.EXPIRE_AT = 'expireAt';
        ExpirationProcessor.CREATE_AT = 'createAt';
        return ExpirationProcessor;
    }(BaseCachePocessor));
    exports.ExpirationProcessor = ExpirationProcessor;
    var StoreProcessor = /** @class */ (function (_super) {
        __extends(StoreProcessor, _super);
        function StoreProcessor(cacheStore) {
            var _this = _super.call(this) || this;
            _this.cacheStore = cacheStore;
            return _this;
        }
        StoreProcessor.prototype.preSet = function (cacheEntry) {
            this.cacheStore.setItem(cacheEntry.key, JSON.stringify(cacheEntry));
            return cacheEntry;
        };
        StoreProcessor.prototype.get = function (key) {
            return this.postGet(key, null);
        };
        StoreProcessor.prototype.postGet = function (key, cacheEntry) {
            var jsonValue = this.cacheStore.getItem(key);
            return jsonValue ? JSON.parse(jsonValue) : null;
        };
        StoreProcessor.prototype.remove = function (key) {
            this.cacheStore.removeItem(key);
        };
        return StoreProcessor;
    }(BaseCachePocessor));
    exports.StoreProcessor = StoreProcessor;
    var createProcessors = function (enableSignature, lifetime, cacheStore) {
        var expire = new ExpirationProcessor(lifetime);
        var final = new StoreProcessor(cacheStore);
        expire.next(final);
        return enableSignature ? new SignatureProcessor().next(expire) : expire;
    };
    exports.createProcessors = createProcessors;
});
define("serializer", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DefaultSerializer = void 0;
    var DefaultSerializer = /** @class */ (function () {
        function DefaultSerializer() {
            var _this = this;
            this.typeInfoKey = '$$cacheable.$$objectType';
            this.dataKey = '$$cacheable.$$object';
            this.supportedTypes = [Map, Set];
            this.type2name = new Map([[Map, 'map'], [Set, 'set']]);
            this.name2converter = new Map([
                ['map', function (obj) {
                        return new Map(obj);
                    }],
                ['set', function (obj) {
                        return new Set(obj);
                    }]
            ]);
            this.replacer = function (key, value) {
                var _a;
                var type = typeof (value);
                if (type !== 'object')
                    return value;
                var matchedType = _this.supportedTypes.find(function (type) { return value instanceof type; });
                if (matchedType) {
                    if (value.hasOwnProperty(_this.typeInfoKey))
                        throw Error("Reserved key " + _this.typeInfoKey + " was used in " + key + "->" + value + "!");
                    return _a = {},
                        _a[_this.typeInfoKey] = _this.type2name.get(matchedType),
                        _a[_this.dataKey] = __spreadArray([], __read(value), false),
                        _a;
                }
                else {
                    return value;
                }
            };
            this.reviver = function (key, value) {
                var type = typeof value;
                var typeInfo = value[_this.typeInfoKey];
                if (type !== 'object' || !_this.name2converter.has(typeInfo))
                    return value;
                var data = value[_this.dataKey];
                var converter = _this.name2converter.get(typeInfo);
                return converter(data);
            };
        }
        DefaultSerializer.prototype.serialize = function (obj) {
            return JSON.stringify(obj, this.replacer);
        };
        DefaultSerializer.prototype.deserialize = function (value) {
            return JSON.parse(value, this.reviver);
        };
        return DefaultSerializer;
    }());
    exports.DefaultSerializer = DefaultSerializer;
});
define("cacheable", ["require", "exports", "processor", "serializer", "store"], function (require, exports, processor_1, serializer_1, store_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LocalMemCacheStore = exports.LocalStorageCacheStore = exports.cacheable = exports.configure = void 0;
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
});
//# sourceMappingURL=jcacheable.js.map