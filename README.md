# cacheable
A simple cache wrapper for functions. Only need 1 line of code to cache the function result.

**Highglights**
- Simple wrapper for function (support async)
- Cache TTL
- Cache signature validation
- Less pollution in your code
- Support Array/Set/Map in returned type
- Support LocalStorage or Memory as cache store


## Install
```bash
npm i side-cache
```

## Usage

**One Line for Cache**
```javascript
import { cacheable } from 'side-cache';

const getUser = async (userId) => {
    const resp = await fetch('https://gorest.co.in/public/v1/users?id=' + userId);
    return await resp.json()
}
const getCacheableUser = cacheable(getUser, (userId)=> `user.${userId}`)

const userInfo = getCacheableUser(1)
console.log(userInfo)
```


**Cache Options**
```javascript
import { cacheable } from 'side-cache';

const getUser = async (userId) => {
    const resp = await fetch('https://gorest.co.in/public/v1/users?id=' + userId);
    return await resp.json()
}
//Cache will expired after 1 hour
const getCacheableUser = cacheable(
        getUser, 
        (userId) => `user.${userId}`, 
        {timeToLive: 3600}
    )

const userInfo = getCacheableUser(1)
console.log(userInfo)
```

**Global Config**
```javascript
import { configure } from 'side-cache';

configure({
    keyPrefix: "cacheable",
    enableSignature: true,
    timeToLive: 3600 * 24 // Default ttl is 1 day (seconds)
    //cacheStore: new LocalStorageCacheStore() - Defautl store in browser.
    //cacheStore: new LocalMemCacheStore() - Default store in Node.
})

```

## API
**cacheable**
```javascript
declare const cacheable: (
    target: Function,                       // support sync/async function
    cacheKeyBuilder: string | Function,     // only support sync function
    options?: CacheOptions
) => any;

interface CacheOptions {
    keyPrefix?: string | Function;          // Support sync/async function
    enableSignature?: boolean;
    timeToLive?: number;
}
```
**configure**
```javascript
declare const configure: (options?: GlobalCacheOptions) => void;

interface GlobalCacheOptions extends CacheOptions {
    cacheStore?: CacheStore;
    serializer?: Serializer<any>;
}
```

## Q&A
- What kind of storage policy support?
  > Currently we only support LocalStorage(in broswer) and LocalMemory(in node), it been selected automatically while runing application.

- Please raise you questions in issues!