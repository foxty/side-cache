import { createHash } from 'crypto';
import { DateTime } from 'luxon';
import { CacheEntry, createProcessors, ExpirationProcessor, SignatureProcessor, StoreProcessor } from "../src/processor"
import { LocalMemCacheStore, LocalStorageCacheStore } from '../src/store';

jest.mock('../src/store')

const CACHE_VALUE = JSON.stringify({ username: 'isaac', password: '123456', address: 'XX street' })
const CACHE_ENTRY: CacheEntry = {
    key: 'test',
    value: CACHE_VALUE,
    metadata: {}
}
const CACHE_ENTRY_NULL_META: CacheEntry = {
    key: 'test',
    value: CACHE_VALUE,
    metadata: null
}

const EXP_CACHED_ENTRY: CacheEntry = {
    ...CACHE_ENTRY,
    metadata: expect.any(Object)
}


describe('Test processor common behavior', () => {

    const processors = [new ExpirationProcessor(100)]

    beforeEach(() => {
        processors.forEach(processor => {
            processor['nextProcessor'] = {
                get: jest.fn(),
                set: jest.fn(),
                remove: jest.fn()
            }
        })
    })

    test('Set entry with null metadata', () => {
        processors.forEach(processor => {
            processor.set(CACHE_ENTRY_NULL_META)
            const setFn = processor['nextProcessor'].set
            expect(setFn).toBeCalledWith(EXP_CACHED_ENTRY)
        })
    })

    test('Set entry will not be changed', () => {
        processors.forEach(processor => {
            processor.set(CACHE_ENTRY)
            const setFn = processor['nextProcessor'].set
            expect(setFn).toBeCalledWith(EXP_CACHED_ENTRY)
            expect(setFn.mock.calls[0][0]).toEqual(EXP_CACHED_ENTRY)
            expect(setFn.mock.calls[0][0] === CACHE_ENTRY).toBeFalsy()
        })
    })

    test('Set entry with metadata', () => {
        processors.forEach(processor => {
            processor.set(CACHE_ENTRY)
            const setFn = processor['nextProcessor'].set
            expect(setFn).toBeCalledWith(EXP_CACHED_ENTRY)
        })
    })

    test('Get invalid key', () => {
        processors.forEach(processor => {
            const randomKey = Math.random().toString(16)
            expect(processor.get(randomKey)).toBeNull()
            delete processor['nextProcessor']
            expect(processor.get(randomKey)).toBeNull()
        })
    })

    test('Remove', () => {
        processors.forEach((processor) => {
            processor.remove('test')
            expect(processor['nextProcessor'].remove).toBeCalledWith('test')
        })
    })
})

describe('Test SignatureProcessor', () => {
    const processor = new SignatureProcessor((data: string) => {
        return createHash('sha256').update(data).digest('hex')
    })

    beforeEach(() => {
        processor['nextProcessor'] = {
            get: jest.fn(),
            set: jest.fn()
        }
    })

    test('Set key', () => {
        processor.set(CACHE_ENTRY)
        const setFn = processor['nextProcessor'].set
        expect(setFn).toBeCalledWith({
            ...CACHE_ENTRY,
            metadata: { [SignatureProcessor.SIGNATURE_KEY]: createHash('sha256').update(CACHE_ENTRY.value).digest('hex') }
        })
    })

    test('Get exist key with null metadata/signature', () => {
        processor['nextProcessor'].get.mockReturnValue(CACHE_ENTRY_NULL_META)
        expect(() => processor.get('test')).toThrowError('Invalid signature')
        processor['nextProcessor'].get.mockReturnValue(CACHE_ENTRY)
        expect(() => processor.get('test')).toThrowError('Invalid signature')
    })

    test('Get exist key with wrong signature', () => {
        processor['nextProcessor'].get.mockReturnValue({
            ...CACHE_ENTRY,
            metadata: {
                [SignatureProcessor.SIGNATURE_KEY]: 'invalid signature'
            }
        })
        expect(() => processor.get('test')).toThrowError('Invalid signature')
    })

    test('Get exist key with correct signature', () => {
        const expectedEntry = {
            ...CACHE_ENTRY,
            metadata: {
                [SignatureProcessor.SIGNATURE_KEY]: createHash('sha256').update(CACHE_ENTRY.value).digest('hex')
            }
        }
        processor['nextProcessor'].get.mockReturnValue(expectedEntry)
        const entry = processor.get('test')
        expect(entry).toEqual(expectedEntry)
        expect(entry === expectedEntry).toBeFalsy()
    })
})

describe('Test ExpirationProcessor', () => {
    const createProcessor = (lifetime: number = -1) => {
        const processor = new ExpirationProcessor(lifetime)
        processor['nextProcessor'] = {
            get: jest.fn(),
            set: jest.fn()
        }
        const nextSet = processor['nextProcessor'].set
        const nextGet = processor['nextProcessor'].get
        return [processor, nextSet, nextGet]
    }

    test('Set positive expiration time success', () => {
        const [processor, nextSet, nextGet] = createProcessor(100)
        processor.set(CACHE_ENTRY)
        expect(nextSet).toBeCalledWith({
            ...CACHE_ENTRY,
            metadata: {
                [ExpirationProcessor.EXPIRE_AT]: expect.any(Number),
                [ExpirationProcessor.CREATE_AT]: expect.any(Number)
            }
        })
    })

    test('Set nagative expiration time success', () => {
        const [processor, nextSet, nextGet] = createProcessor(-1)
        processor.set(CACHE_ENTRY)
        expect(nextSet).toBeCalledWith({
            ...CACHE_ENTRY,
            metadata: {
                [ExpirationProcessor.EXPIRE_AT]: -1,
                [ExpirationProcessor.CREATE_AT]: expect.any(Number)
            }
        })
    })

    test('Get success', () => {
        const [processor, nextSet, nextGet] = createProcessor(100)
        nextGet.mockReturnValue({
            ...CACHE_ENTRY,
            metadata: {
                [ExpirationProcessor.EXPIRE_AT]: DateTime.now().toSeconds() + 100,
                [ExpirationProcessor.CREATE_AT]: DateTime.now().toSeconds()
            }
        })
        const cachedEntry = processor.get('test')
        expect(cachedEntry).toEqual({
            ...CACHE_ENTRY,
            metadata: expect.any(Object)
        })
    })

    test('Get with negative expire time success', () => {
        const [processor, nextSet, nextGet] = createProcessor(100)
        nextGet.mockReturnValue({
            ...CACHE_ENTRY,
            metadata: {
                [ExpirationProcessor.EXPIRE_AT]: -1,
                [ExpirationProcessor.CREATE_AT]: DateTime.now().toSeconds()
            }
        })
        const cachedEntry = processor.get('test')
        expect(cachedEntry).toEqual({
            ...CACHE_ENTRY,
            metadata: expect.any(Object)
        })
    })

    test('Get expired cache entry', () => {
        const [processor, nextSet, nextGet] = createProcessor(100)
        nextGet.mockReturnValue({
            ...CACHE_ENTRY,
            metadata: {
                [ExpirationProcessor.EXPIRE_AT]: DateTime.now().toSeconds() - 10,
                [ExpirationProcessor.CREATE_AT]: DateTime.now().toSeconds()
            }
        })
        expect(() => processor.get('test')).toThrowError(`Cache ${CACHE_ENTRY.key} expired`)
    })
})

describe('Test StoreProcessor', () => {
    const MockedCacheStore = LocalMemCacheStore as jest.MockedClass<typeof LocalMemCacheStore>
    const memStore = new MockedCacheStore()
    const storeProcessor = new StoreProcessor(memStore)
    beforeEach(() => {
        MockedCacheStore.mockClear()
    })

    test('Set key', () => {
        storeProcessor.set(CACHE_ENTRY)
        expect(memStore.setItem).toBeCalledWith(CACHE_ENTRY.key, JSON.stringify(CACHE_ENTRY))
    })

    test('Get key', () => {
        storeProcessor.get('test')
        expect(memStore.getItem).toBeCalledWith('test')
    })

    test('Remove key', () => {
        storeProcessor.remove('test')
        expect(memStore.removeItem).toBeCalledWith('test')
    })
})

describe('Test createProcessors', () => {
    test('creation w/o signature', () => {
        const processor = createProcessors(null, 100, new LocalStorageCacheStore())
        expect(processor instanceof ExpirationProcessor).toBeTruthy()
        expect(processor['nextProcessor'] instanceof StoreProcessor).toBeTruthy()
        expect(processor['nextProcessor']['nextProcessor']).toBeNull()
    })

    test('creation with signature', () => {
        const processor = createProcessors(
            (data) => createHash('sha256').update(data).digest('hex'),
            100,
            new LocalStorageCacheStore()
        )
        expect(processor instanceof SignatureProcessor).toBeTruthy()
        expect(processor['nextProcessor'] instanceof ExpirationProcessor).toBeTruthy()
        expect(processor['nextProcessor']['nextProcessor'] instanceof StoreProcessor).toBeTruthy()
        expect(processor['nextProcessor']['nextProcessor']['nextProcessor']).toBeNull()
    })
})