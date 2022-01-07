import { Serializer } from "./serializer";
import { CacheStore, LocalStorageCacheStore, LocalMemCacheStore } from "./store";
interface CacheOptions {
    keyPrefix?: string | Function;
    enableSignature?: boolean;
    timeToLive?: number;
}
interface GlobalCacheOptions extends CacheOptions {
    cacheStore?: CacheStore;
    serializer?: Serializer<any>;
}
declare const configure: (options?: GlobalCacheOptions) => Promise<void>;
declare const cacheable: <T>(target: Function, cacheKeyBuilder: string | Function, options?: CacheOptions) => any;
export { configure, cacheable, LocalStorageCacheStore, LocalMemCacheStore };
