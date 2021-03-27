const cache = new Map();

declare const chrome: any;

const resolvePath = (path: string) => {
  const parts = path.split('.');
  const endPoint = parts.pop()!;
  let scope = self as Record<string, any>;
  while (parts.length) {
    const prop = parts.shift()!;
    scope = scope[prop];
  }
  return {scope, endPoint};
};

const promisifyApi = <T>(path: string): (...any: any[]) => Promise<T> => {
  if (!cache.has(path)) {
    const {scope, endPoint: fn} = resolvePath(path);
    cache.set(path, (...args: any[]) => new Promise((resolve, reject) => scope[fn].call(scope, ...args, (result: T) => {
      const err = chrome.runtime.lastError;
      err ? reject(err) : resolve(result);
    })));
  }
  return cache.get(path);
};

export default promisifyApi;
