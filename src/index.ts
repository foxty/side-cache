import { CacheEntry, createProcessors, SignatureProcessor } from "./processor"
import { DefaultSerializer, Serializer } from "./serializer"
import { CacheStore, LocalStorageCacheStore, LocalMemCacheStore } from "./store"

const IS_IN_BROWSER = typeof window === 'object'

interface CacheOptions {
    keyPrefix?: string,
    enableSignature?: boolean,
    timeToLive?: number,
    //allowStaledValue?: boolean,
}

interface GlobalCacheOptions extends CacheOptions {
    cacheStore?: CacheStore,
    serializer?: Serializer<any>,
}

const DEFAULT_GLOBAL_OPTS: GlobalCacheOptions = {
    keyPrefix: 'cacheable',
    enableSignature: false,
    timeToLive: -1,
    cacheStore: IS_IN_BROWSER ? new LocalStorageCacheStore() : new LocalMemCacheStore(),
    serializer: new DefaultSerializer(),

}
let GLOBAL_CACHE_OPTS: GlobalCacheOptions = DEFAULT_GLOBAL_OPTS
const configure = (options: GlobalCacheOptions = DEFAULT_GLOBAL_OPTS) => {
    GLOBAL_CACHE_OPTS = Object.assign({}, DEFAULT_GLOBAL_OPTS, options)
}

const cacheable = <T>(
    target: Function,
    cacheKeyBuilder: Function = () => target.name,
    options: CacheOptions = {}
) => {

    const getCacheOptions = () => {
        return Object.assign({}, GLOBAL_CACHE_OPTS, options)
    }

    const getCache = (cacheKey: string): any => {
        const { timeToLive, enableSignature, cacheStore, serializer } = getCacheOptions()
        const processors = createProcessors(enableSignature, timeToLive, cacheStore)
        try {
            const cacheEntry: CacheEntry = processors.get(cacheKey)
            return cacheEntry ? serializer.deserialize(cacheEntry.value) : null
        } catch (e) {
            console.warn(`Error while get cache for key=${cacheKey}.`, e)
            processors.remove(cacheKey)
            return null
        }
    }

    const saveCache = (cacheKey: string, value: any) => {
        const { timeToLive, enableSignature, cacheStore, serializer } = getCacheOptions()
        const processors = createProcessors(enableSignature, timeToLive, cacheStore)
        const serializedCacheValue = serializer.serialize(value)
        const cacheEntry: CacheEntry = {
            key: cacheKey,
            value: serializedCacheValue
        }
        try {
            processors.set(cacheEntry)
        } catch (e) {
            console.warn(`Error while set cache for key ${cacheKey}`)
        }
    }

    return new Proxy(target, {
        apply(target: any, thisArg: any, argArray: Array<any>): T | Promise<T> {
            const { keyPrefix } = getCacheOptions()
            const cacheKey = keyPrefix + '.' + cacheKeyBuilder.apply(null, argArray)
            let cachedData = getCache(cacheKey)
            if (cachedData) return cachedData

            const response = target.apply(thisArg, argArray)
            if (response instanceof Promise) {
                response.then((data) => { saveCache(cacheKey, data) })
                return response
            } else {
                saveCache(cacheKey, response)
                cachedData = response
                return cachedData
            }
        }
    })
}

export { configure, cacheable, LocalStorageCacheStore, LocalMemCacheStore }