class Cache {
  constructor(limit) {
    this._keys = [];
    this._values = [];
    this._limit = limit;
  }
  get(key) {
    const pos = this._keys.indexOf(key);
    if (pos !== -1) {
      return this._values[pos];
    } else {
      return undefined;
    }
  }
  set(key, value) {
    this._keys.unshift(key);
    this._values.unshift(value);
    this._keys.splice(this._limit);
    this._values.splice(this._limit);
  }
}

export default Cache;