import { Serializer } from "./serializer";
import { CacheStore, LocalStorageCacheStore, LocalMemCacheStore } from "./store";
interface CacheOptions {
    keyPrefix?: string;
    enableSignature?: boolean;
    timeToLive?: number;
}
interface GlobalCacheOptions extends CacheOptions {
    cacheStore?: CacheStore;
    serializer?: Serializer<any>;
}
export declare const configure: (options?: GlobalCacheOptions) => void;
export declare const cacheable: (target: Function, cacheKeyBuilder?: Function, options?: CacheOptions) => any;
export { LocalStorageCacheStore, LocalMemCacheStore };
