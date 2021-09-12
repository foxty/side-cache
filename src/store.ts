interface CacheStore {
    setItem(key: string, value: string): void
    getItem(key: string): string
    removeItem(key: string): void
}

class LocalStorageCacheStore implements CacheStore {
    setItem(key: string, value: string): void {
        localStorage.setItem(key, value)
    }
    getItem(key: string): string {
        return localStorage.getItem(key)
    }
    removeItem(key: string): void {
        localStorage.removeItem(key)
    }
}

class LocalMemCacheStore implements CacheStore {
    private store: Map<string, string>
    constructor() {
        this.store = new Map<string, string>()
    }

    setItem(key: string, value: string): void {
        this.store.set(key, value)
    }
    getItem(key: string): string {
        return this.store.get(key)
    }
    removeItem(key: string): void {
        this.store.delete(key)
    }
}

export { CacheStore, LocalMemCacheStore, LocalStorageCacheStore }