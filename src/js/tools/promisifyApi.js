const cache = new WeakMap();

/**
 * @param {function} fn
 * @return {Promise<any>}
 */
const promisifyApi = fn => {
  if (!cache.has(fn)) {
    cache.set(fn, (...args) => new Promise(resolve => fn(...args, resolve)));
  }
  return cache.get(fn);
};

export default promisifyApi;