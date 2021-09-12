declare module "store" {
    interface CacheStore {
        setItem(key: string, value: string): void;
        getItem(key: string): string;
        removeItem(key: string): void;
    }
    class LocalStorageCacheStore implements CacheStore {
        setItem(key: string, value: string): void;
        getItem(key: string): string;
        removeItem(key: string): void;
    }
    class LocalMemCacheStore implements CacheStore {
        private store;
        constructor();
        setItem(key: string, value: string): void;
        getItem(key: string): string;
        removeItem(key: string): void;
    }
    export { CacheStore, LocalMemCacheStore, LocalStorageCacheStore };
}
declare module "processor" {
    import { CacheStore } from "store";
    interface CacheEntry {
        key: string;
        value: string;
        metadata?: {
            [key: string]: any;
        };
    }
    abstract class BaseCachePocessor {
        protected nextProcessor: any;
        cloneEntry(cacheEntry: CacheEntry): CacheEntry;
        next(processor: BaseCachePocessor): BaseCachePocessor;
        set(cacheEntry: CacheEntry): void;
        abstract preSet(cacheEntry: CacheEntry): CacheEntry;
        get(key: string): CacheEntry;
        abstract postGet(key: string, cacheEntry: CacheEntry): CacheEntry;
        remove(key: string): void;
    }
    class SignatureProcessor extends BaseCachePocessor {
        static readonly SIGNATURE_KEY = "signature";
        private createSignature;
        private verifySignature;
        preSet(entry: CacheEntry): CacheEntry;
        postGet(key: string, entry: CacheEntry): CacheEntry;
    }
    class ExpirationProcessor extends BaseCachePocessor {
        private lifetime;
        static readonly EXPIRE_AT = "expireAt";
        static readonly CREATE_AT = "createAt";
        constructor(lifetime: number);
        preSet(cacheEntry: CacheEntry): CacheEntry;
        postGet(key: string, cacheEntry: CacheEntry): CacheEntry;
    }
    class StoreProcessor extends BaseCachePocessor {
        private cacheStore;
        constructor(cacheStore: CacheStore);
        preSet(cacheEntry: CacheEntry): CacheEntry;
        get(key: string): CacheEntry;
        postGet(key: string, cacheEntry: CacheEntry): CacheEntry;
        remove(key: string): void;
    }
    const createProcessors: (enableSignature: boolean, lifetime: number, cacheStore: CacheStore) => BaseCachePocessor;
    export { CacheEntry, BaseCachePocessor, SignatureProcessor, ExpirationProcessor, StoreProcessor, createProcessors };
}
declare module "serializer" {
    interface Serializer<T> {
        serialize(obj: T): string;
        deserialize(value: string): T;
    }
    class DefaultSerializer implements Serializer<Object> {
        private typeInfoKey;
        private dataKey;
        private supportedTypes;
        private type2name;
        private name2converter;
        private replacer;
        private reviver;
        serialize(obj: any): string;
        deserialize(value: string): any;
    }
    export { Serializer, DefaultSerializer };
}
declare module "cacheable" {
    import { Serializer } from "serializer";
    import { CacheStore, LocalStorageCacheStore, LocalMemCacheStore } from "store";
    interface CacheOptions {
        keyPrefix?: string;
        enableSignature?: boolean;
        timeToLive?: number;
    }
    interface GlobalCacheOptions extends CacheOptions {
        cacheStore?: CacheStore;
        serializer?: Serializer<any>;
    }
    export const configure: (options?: GlobalCacheOptions) => void;
    export const cacheable: (target: Function, cacheKeyBuilder?: Function, options?: CacheOptions) => any;
    export { LocalStorageCacheStore, LocalMemCacheStore };
}
