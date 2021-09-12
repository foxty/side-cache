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
//# sourceMappingURL=store.js.map