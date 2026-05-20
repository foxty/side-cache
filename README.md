# side-cache

> A lightweight, one-line caching wrapper for JavaScript/TypeScript functions. Works in both Browser and Node.js.

[![npm version](https://img.shields.io/npm/v/side-cache)](https://www.npmjs.com/package/side-cache)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue)](LICENSE)

## Highlights

- **One-line caching** — wrap any sync/async function with zero boilerplate
- **TTL support** — per-call or global expiration in seconds
- **Signature validation** — optional integrity checks for cached data
- **Auto-detects runtime** — `localStorage` in browsers, in-memory `Map` in Node.js
- **Map/Set/Array support** — built-in serializer handles complex types
- **Pluggable store & serializer** — swap in your own backends
- **Zero dependencies** — tiny footprint

## Install

```bash
npm install side-cache
```

## Quick Start

```javascript
import { cacheable } from 'side-cache';

const getUser = async (userId) => {
  const resp = await fetch(`https://api.example.com/users/${userId}`);
  return resp.json();
};

// One line — that's it.
const getCachedUser = cacheable(getUser, (userId) => `user.${userId}`);

const user = await getCachedUser(1); // fetches
const cached = await getCachedUser(1); // from cache
```

## Usage

### With TTL

```javascript
const getCachedUser = cacheable(getUser, (userId) => `user.${userId}`, {
  timeToLive: 3600, // expire after 1 hour
});
```

### Global Configuration

```javascript
import { configure } from 'side-cache';
import { createHash } from 'crypto';

configure({
  keyPrefix: 'myapp',
  timeToLive: 86400, // 24 hours
  signer: (data) => createHash('sha256').update(data).digest('hex'),
});
```

### Custom Cache Store (Node.js)

```javascript
import { configure, LocalMemCacheStore } from 'side-cache';

configure({
  cacheStore: new LocalMemCacheStore(),
});
```

### Custom Cache Store (Browser)

```javascript
import { configure, LocalStorageCacheStore } from 'side-cache';

configure({
  cacheStore: new LocalStorageCacheStore(),
});
```

### Signature Validation

```javascript
const getCachedUser = cacheable(getUser, (userId) => `user.${userId}`, {
  enableSignature: true,
  signer: (data) => myHashFn(data),
});
```

## API

### `cacheable(target, cacheKeyBuilder, options?)`

Wraps a function with caching logic using a `Proxy`.

| Param            | Type                        | Description                                |
| ---------------- | --------------------------- | ------------------------------------------ |
| `target`         | `Function`                  | Sync or async function to cache            |
| `cacheKeyBuilder`| `string \| (...args) => string` | Cache key (static string or dynamic builder) |
| `options`        | `CacheOptions`              | *(optional)* Per-call overrides            |

#### `CacheOptions`

| Option            | Type                        | Default    | Description                               |
| ----------------- | --------------------------- | ---------- | ----------------------------------------- |
| `keyPrefix`       | `string \| Function`        | `'cacheable'` | Prefix for all cache keys             |
| `timeToLive`      | `number`                    | `-1` (no expiry) | TTL in seconds                     |
| `signer`          | `(data: string) => string`  | `null`     | Function to sign cached data               |
| `enableSignature` | `boolean`                   | `false`    | Enable cache signature validation          |

### `configure(options?)`

Sets global defaults for all `cacheable()` calls.

| Option       | Type              | Default                                  | Description              |
| ------------ | ----------------- | ---------------------------------------- | ------------------------ |
| `cacheStore` | `CacheStore`      | `LocalStorageCacheStore` (browser) / `LocalMemCacheStore` (Node) | Storage backend |
| `serializer` | `Serializer<any>` | `DefaultSerializer`                      | Custom serializer        |

*(All `CacheOptions` fields are also accepted.)*

### `CacheStore` Interface

```typescript
interface CacheStore {
  setItem(key: string, value: string): void;
  getItem(key: string): string;
  removeItem(key: string): void;
}
```

Built-in stores: `LocalStorageCacheStore`, `LocalMemCacheStore`.

### `Serializer` Interface

```typescript
interface Serializer<T> {
  serialize(obj: T): string;
  deserialize(value: string): T;
}
```

## How It Works

`side-cache` uses a JavaScript `Proxy` to intercept function calls. On the first invocation with a given key, it executes the original function and stores the result. Subsequent calls skip execution and return the cached value directly. A chain of processors handles **expiration** and optional **signature validation** before delegating to the configured `CacheStore`.

## FAQ

**Does it work in browsers?**  
Yes — it automatically selects `localStorage` in browser environments.

**Does it work with async functions?**  
Yes — Promises are transparently cached after resolution.

**Can I use a custom storage backend?**  
Yes — implement the `CacheStore` interface and pass it via `configure()`.

**What types are supported in return values?**  
Plain objects, arrays, `Map`, and `Set` are all handled by the default serializer.

## License

[Apache-2.0](LICENSE)
