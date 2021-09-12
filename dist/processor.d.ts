import { CacheStore } from "./store";
interface CacheEntry {
    key: string;
    value: string;
    metadata?: {
        [key: string]: any;
    };
}
declare abstract class BaseCachePocessor {
    protected nextProcessor: any;
    cloneEntry(cacheEntry: CacheEntry): CacheEntry;
    next(processor: BaseCachePocessor): BaseCachePocessor;
    set(cacheEntry: CacheEntry): void;
    abstract preSet(cacheEntry: CacheEntry): CacheEntry;
    get(key: string): CacheEntry;
    abstract postGet(key: string, cacheEntry: CacheEntry): CacheEntry;
    remove(key: string): void;
}
declare class SignatureProcessor extends BaseCachePocessor {
    static readonly SIGNATURE_KEY = "signature";
    private createSignature;
    private verifySignature;
    preSet(entry: CacheEntry): CacheEntry;
    postGet(key: string, entry: CacheEntry): CacheEntry;
}
declare class ExpirationProcessor extends BaseCachePocessor {
    private lifetime;
    static readonly EXPIRE_AT = "expireAt";
    static readonly CREATE_AT = "createAt";
    constructor(lifetime: number);
    preSet(cacheEntry: CacheEntry): CacheEntry;
    postGet(key: string, cacheEntry: CacheEntry): CacheEntry;
}
declare class StoreProcessor extends BaseCachePocessor {
    private cacheStore;
    constructor(cacheStore: CacheStore);
    preSet(cacheEntry: CacheEntry): CacheEntry;
    get(key: string): CacheEntry;
    postGet(key: string, cacheEntry: CacheEntry): CacheEntry;
    remove(key: string): void;
}
declare const createProcessors: (enableSignature: boolean, lifetime: number, cacheStore: CacheStore) => BaseCachePocessor;
export { CacheEntry, BaseCachePocessor, SignatureProcessor, ExpirationProcessor, StoreProcessor, createProcessors };
