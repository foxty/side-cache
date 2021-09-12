# cacheable
Enable cache for Javascript function calls. Basically, you can enable cache for any function call and cache the returned data in LocalStorage, Memory (Will support Redis, Mysql soon).


## Install

```
npm i jcacheable
```

## Usage

**Global Config**
```
import { configure } from 'jcacheable';

configure({
    keyPrefix: "cacheable",
    enableSignature: true,
    timeToLive: 3600 * 24 // Default ttl is 1 day (seconds)
    //cacheStore: new LocalStorageCacheStore() - Default use localStorange as storage.
})

```

**Cache Function Result**
```
import { cacheable } from 'jcacheable';

const getUser = async (userId) => {
    const resp = await feth('https://gorest.co.in/public/v1/users?id=' + userId);
    return await resp.json()
}
const getCacheableUser = cacheable(getUser, (userId)=> `user.${userId}`)

const userInfo = getCacheableUser(1)
console.log(userInfo)
```

**Customize Options**
```
import { cacheable } from 'jcacheable';

const getUser = async (userId) => {
    const resp = await feth('https://gorest.co.in/public/v1/users?id=' + userId);
    return await resp.json()
}
//Cache will expired after 1 hour
const getCacheableUser = cacheable(
        getUser, 
        (userId)=> `user.${userId}`, 
        {timeToLive: 3600}
    )

const userInfo = getCacheableUser(1)
console.log(userInfo)
```

## Q&A
