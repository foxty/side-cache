interface CacheStore {
    setItem(key: string, value: string): void;
    getItem(key: string): string;
    removeItem(key: string): void;
}
declare class LocalStorageCacheStore implements CacheStore {
    setItem(key: string, value: string): void;
    getItem(key: string): string;
    removeItem(key: string): void;
}
declare class LocalMemCacheStore implements CacheStore {
    private store;
    constructor();
    setItem(key: string, value: string): void;
    getItem(key: string): string;
    removeItem(key: string): void;
}
export { CacheStore, LocalMemCacheStore, LocalStorageCacheStore };
