import { cacheable, configure } from "../src/index"
import { CacheEntry, createProcessors, BaseCachePocessor } from "../src/processor"
import { LocalMemCacheStore } from "../src/store";

jest.mock("../src/processor", () => {
    const originalModule = jest.requireActual("../src/processor");
    //Mock the default export and named export 'processor'
    return {
        __esModule: true,
        ...originalModule,
        createProcessors: jest.fn()
    };
});
class MockedCacheProcessor extends BaseCachePocessor {
    get = jest.fn()

    set = jest.fn()

    remove = jest.fn()

    preSet(cacheEntry: CacheEntry): CacheEntry {
        throw new Error("Method not implemented.");
    }
    postGet(key: string, cacheEntry: CacheEntry): CacheEntry {
        throw new Error("Method not implemented.");
    }
}
const mockedCreateProcessors = createProcessors as jest.MockedFunction<typeof createProcessors>
const mockedProcessor = new MockedCacheProcessor()
mockedCreateProcessors.mockReturnValue(mockedProcessor)

beforeEach(() => {
    mockedCreateProcessors.mockClear()
    mockedProcessor.get.mockClear()
    mockedProcessor.set.mockClear()
    mockedProcessor.remove.mockClear()
})

afterEach(() => {

})

describe('Test cacheable', () => {
    const getConfigs = (): { [key: string]: string } => {
        return { Config: 'config' }
    }
    const getCacheableConfigs = cacheable<string>(getConfigs, () => 'configs')
    const expectedStringInCache = JSON.stringify(getConfigs())

    test('cacheKeyBuilder is string', () => {
        const cachedCall = cacheable(() => '123', 'key123')
        expect(cachedCall()).toBe('123')
        expect(mockedProcessor.get).toBeCalledWith('cacheable.key123')
        expect(mockedProcessor.set).toBeCalledWith({
            key: 'cacheable.key123',
            value: '\"123\"'
        })
    })

    test('cacheKeyBuilder is function', () => {
        const cachedCall = cacheable(() => '123', () => 'key123')
        expect(cachedCall()).toBe('123')
        expect(mockedProcessor.get).toBeCalledWith('cacheable.key123')
        expect(mockedProcessor.set).toBeCalledWith({
            key: 'cacheable.key123',
            value: '\"123\"'
        })
    })

    test('Get should be get with correct result', () => {
        const cacheProxy = cacheable(() => { return 'isaac' }, () => 'name')
        expect(cacheProxy()).toBe('isaac')
    })

    test('Cache should be set with no param', () => {
        const result = getCacheableConfigs()
        expect(result).toEqual(getConfigs())
        expect(mockedProcessor.get).toBeCalledWith('cacheable.configs')
        expect(mockedProcessor.set).toBeCalledWith({ key: 'cacheable.configs', value: expectedStringInCache })
    })

    test('Cache should be set with multi-params', () => {
        const getUserAddress = (databaseId: string, userId: string) => `(${databaseId})Shenzhen, Nanshan, 999 Street.`;
        const getCacheableUserAddress = cacheable(getUserAddress, (dbId, userId) => `addr-${dbId}-${userId}`)
        const expResult = getUserAddress('db01', 'uid001')
        const resultByCache = getCacheableUserAddress('db01', 'uid001')
        expect(resultByCache).toEqual(expResult)
        expect(mockedProcessor.get).toBeCalledWith('cacheable.addr-db01-uid001')
        expect(mockedProcessor.set).toBeCalledWith({ key: 'cacheable.addr-db01-uid001', value: JSON.stringify(expResult) })
    })


    test('Cache should be hit', () => {
        const cacheValue: CacheEntry = { key: 'cacheable.getConfigs', value: JSON.stringify(getConfigs()), metadata: {} }
        mockedProcessor.get.mockReturnValue(cacheValue)
        let result = getCacheableConfigs()
        result = getCacheableConfigs()
        result = getCacheableConfigs()
        expect(result).toEqual(getConfigs())
        expect(mockedProcessor.get).toBeCalledTimes(3)
        expect(mockedProcessor.set).toBeCalledTimes(0)
    })

    test('Cache should be updated if local cache break', () => {
        const cacheValue: CacheEntry = { key: 'cacheable.getConfigs', value: JSON.stringify(getConfigs()) }
        mockedProcessor.get.mockReturnValueOnce(cacheValue).mockReturnValueOnce('{abc')
        let result = getCacheableConfigs()
        expect(result).toEqual(getConfigs())
        expect(mockedProcessor.get).toBeCalledTimes(1)
        expect(mockedProcessor.set).toBeCalledTimes(0)

        result = getCacheableConfigs()
        expect(result).toEqual(getConfigs())
        expect(mockedProcessor.get).toBeCalledTimes(2)
        expect(mockedProcessor.set).toBeCalledTimes(1)
        expect(mockedProcessor.set).toHaveBeenCalledWith({ key: 'cacheable.configs', value: expectedStringInCache })
    })

    test('Cache should be updated if expired', () => {
        mockedProcessor.get.mockImplementation(() => { throw new Error('Key expired!') })
        let result = getCacheableConfigs()
        expect(result).toEqual(getConfigs())
        expect(mockedProcessor.get).toBeCalledTimes(1)
        expect(mockedProcessor.remove).toBeCalledTimes(1)
        expect(mockedProcessor.set).toBeCalledTimes(1)
    })

    test('Cache should be set with async target', async () => {
        const asyncCacheable = cacheable(() => {
            return Promise.resolve({ name: 'foxty' })
        }, () => 'async-cacheable')
        const result = await asyncCacheable()
        expect(result).toEqual({ name: 'foxty' })
        expect(mockedProcessor.set).toBeCalledWith({ key: 'cacheable.async-cacheable', value: JSON.stringify({ name: 'foxty' }) })
    })

    test('Error tolerance while get', async () => {
        mockedProcessor.get = jest.fn(() => {
            throw new Error('bla');
        })

        const cachedFunc = cacheable(() => {
            return { name: 'foxty' }
        }, () => 'error')
        const result = cachedFunc()
        expect(result).toEqual({ name: 'foxty' })
        expect(mockedProcessor.set).toBeCalledWith({ key: 'cacheable.error', value: JSON.stringify({ name: 'foxty' }) })
    })

    test('Error tolerance while set', async () => {
        mockedProcessor.set = jest.fn(() => {
            throw new Error('bla');
        })

        const cachedFunc = cacheable(() => {
            return { name: 'foxty' }
        }, () => 'error')
        const result = cachedFunc()
        expect(result).toEqual({ name: 'foxty' })
        expect(mockedProcessor.set).toBeCalledWith({ key: 'cacheable.error', value: JSON.stringify({ name: 'foxty' }) })
    })
})

describe('Test configuration', () => {
    test('Default global config should be take effect', () => {
        const cachedCall = cacheable(() => '123', () => { 'test' })
        const value = cachedCall()
        expect(mockedCreateProcessors).toBeCalledTimes(2)
        expect(mockedCreateProcessors).toBeCalledWith(false, -1, new LocalMemCacheStore())
    })

    test('Override global config', () => {
        configure({
            enableSignature: true,
            timeToLive: 168,
            cacheStore: new LocalMemCacheStore()
        })
        const cachedCall = cacheable(() => '123', () => { 'test' })
        const value = cachedCall()
        expect(mockedCreateProcessors).toBeCalledTimes(2)
        expect(mockedCreateProcessors).toBeCalledWith(true, 168, new LocalMemCacheStore())
    })

    test('Global keyPrefix by string', async () => {
        await configure({
            keyPrefix: 'global-prefix-in-string'
        })
        const cachedCall = cacheable(() => '123', () => '123key')
        expect(cachedCall()).toBe('123')
        expect(mockedProcessor.get).toBeCalledWith('global-prefix-in-string.123key')
        expect(mockedProcessor.set).toBeCalledWith({
            key: 'global-prefix-in-string.123key',
            value: '\"123\"'
        })
    })

    test('Global keyPrefix by sync function', () => {
        configure({
            timeToLive: 100,
            keyPrefix: function () { return 'global-prefix-in-func-' + this.timeToLive }
        })
        const cachedCall = cacheable(() => '123', () => '123key')
        expect(cachedCall()).toBe('123')
        expect(mockedProcessor.get).toBeCalledWith('global-prefix-in-func-100.123key')
        expect(mockedProcessor.set).toBeCalledWith({
            key: 'global-prefix-in-func-100.123key',
            value: '\"123\"'
        })
    })

    test('Global keyPrefix by async function', async () => {
        await configure({
            timeToLive: 100,
            keyPrefix: function () { return Promise.resolve('global-prefix-in-func-' + this.timeToLive) }
        })
        const cachedCall = cacheable(() => '123', () => '123key')
        expect(cachedCall()).toBe('123')
        expect(mockedProcessor.get).toBeCalledWith('global-prefix-in-func-100.123key')
        expect(mockedProcessor.set).toBeCalledWith({
            key: 'global-prefix-in-func-100.123key',
            value: '\"123\"'
        })
    })
})