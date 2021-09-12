"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProcessors = exports.StoreProcessor = exports.ExpirationProcessor = exports.SignatureProcessor = exports.BaseCachePocessor = void 0;
var luxon_1 = require("luxon");
var crypto_1 = require("crypto");
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
//# sourceMappingURL=processor.js.map