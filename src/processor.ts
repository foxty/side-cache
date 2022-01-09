import { CacheStore } from "./store";

export type Signer = (data: string) => string
interface CacheEntry {
    key: string,
    value: string,
    metadata?: { [key: string]: any }
}

abstract class BaseCachePocessor {
    protected nextProcessor = null

    cloneEntry(cacheEntry: CacheEntry): CacheEntry {
        const clonedEntry = {
            key: cacheEntry.key,
            value: cacheEntry.value,
            metadata: Object.assign({}, cacheEntry.metadata)
        }
        return clonedEntry
    }

    next(processor: BaseCachePocessor): BaseCachePocessor {
        this.nextProcessor = processor
        return this
    }

    set(cacheEntry: CacheEntry): void {
        const clonedEntry = this.cloneEntry(cacheEntry)
        cacheEntry = this.preSet(clonedEntry)
        this.nextProcessor && this.nextProcessor.set(clonedEntry)
    }

    abstract preSet(cacheEntry: CacheEntry): CacheEntry

    get(key: string): CacheEntry {
        const cacheEntry: CacheEntry = this.nextProcessor ? this.nextProcessor.get(key) : null
        return cacheEntry ? this.postGet(key, this.cloneEntry(cacheEntry)) : null
    }

    abstract postGet(key: string, cacheEntry: CacheEntry): CacheEntry;

    remove(key: string) {
        this.nextProcessor && this.nextProcessor.remove(key)
    }
}

class SignatureProcessor extends BaseCachePocessor {

    static readonly SIGNATURE_KEY = 'signature'
    private _signer: Signer
    constructor(signer: Signer) {
        super()
        this._signer = signer
    }

    private createSignature(content: string): string {
        return this._signer(content)//createHash('sha256').update(content).digest('hex')
    }

    private verifySignature(content: string, signature: string): boolean {
        return this._signer(content) === signature
    }

    preSet(entry: CacheEntry): CacheEntry {
        const signature = this.createSignature(entry.value)
        entry.metadata[SignatureProcessor.SIGNATURE_KEY] = signature
        return entry
    }

    postGet(key: string, entry: CacheEntry): CacheEntry {
        const signature = entry.metadata[SignatureProcessor.SIGNATURE_KEY]
        const invalidSignature = !this.verifySignature(entry.value, signature)
        if (invalidSignature) throw new Error(`Invalid signature ${signature} of ${key}`);
        return entry
    }

}

class ExpirationProcessor extends BaseCachePocessor {
    static readonly EXPIRE_AT = 'expireAt'
    static readonly CREATE_AT = 'createAt'

    constructor(private lifetime: number) {
        super()
    }

    preSet(cacheEntry: CacheEntry): CacheEntry {
        const epochSeconds = Math.floor(new Date().getTime() / 1000)
        cacheEntry.metadata[ExpirationProcessor.EXPIRE_AT] = this.lifetime >= 0 ? epochSeconds + this.lifetime : -1
        cacheEntry.metadata[ExpirationProcessor.CREATE_AT] = epochSeconds
        return cacheEntry
    }

    postGet(key: string, cacheEntry: CacheEntry): CacheEntry {
        const epochSeconds = Math.floor(new Date().getTime() / 1000)
        const expireAt = cacheEntry.metadata[ExpirationProcessor.EXPIRE_AT] || -1
        const createAt = cacheEntry.metadata[ExpirationProcessor.CREATE_AT] || -1
        if (expireAt > 0 && expireAt < epochSeconds)
            throw new Error(`Cache ${key} expired: expireAt=${expireAt}, createAt=${createAt}`);
        return cacheEntry
    }
}

class StoreProcessor extends BaseCachePocessor {

    constructor(private cacheStore: CacheStore) {
        super()
    }

    preSet(cacheEntry: CacheEntry): CacheEntry {
        this.cacheStore.setItem(cacheEntry.key, JSON.stringify(cacheEntry))
        return cacheEntry
    }

    get(key: string): CacheEntry {
        return this.postGet(key, null)
    }

    postGet(key: string, cacheEntry: CacheEntry): CacheEntry {
        const jsonValue = this.cacheStore.getItem(key)
        return jsonValue ? JSON.parse(jsonValue) : null
    }

    remove(key: string) {
        this.cacheStore.removeItem(key)
    }
}

const createProcessors = (signer: Signer, lifetime: number, cacheStore: CacheStore): BaseCachePocessor => {
    const expire = new ExpirationProcessor(lifetime)
    const final = new StoreProcessor(cacheStore)
    expire.next(final)
    return signer ? new SignatureProcessor(signer).next(expire) : expire
}

export { CacheEntry, BaseCachePocessor, SignatureProcessor, ExpirationProcessor, StoreProcessor, createProcessors }