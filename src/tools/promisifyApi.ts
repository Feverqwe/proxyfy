const cache = new Map();

const resolvePath = (path: string) => {
  const parts = path.split('.');
  const endPoint = parts.pop()!;
  let scope = self;
  while (parts.length) {
    const prop = parts.shift()!;
    // @ts-ignore
    scope = scope[prop];
  }
  return {scope, endPoint};
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const promisifyApi = <T>(path: string): ((...any: any[]) => Promise<T>) => {
  if (!cache.has(path)) {
    const {scope, endPoint: fn} = resolvePath(path);
    /* eslint-disable no-promise-executor-return */
    cache.set(
      path,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (...args: any[]) =>
        new Promise((resolve, reject) =>
          // @ts-ignore
          scope[fn].call(scope, ...args, (result: T) => {
            const err = chrome.runtime.lastError;
            err ? reject(err) : resolve(result);
          }),
        ),
    );
  }
  return cache.get(path);
};

export default promisifyApi;
