import getId from './getId';

const map = new WeakMap<object, string>();

function getObjectId(obj: object) {
  let id = map.get(obj);
  if (!id) {
    map.set(obj, (id = getId()));
  }
  return id;
}

export default getObjectId;
