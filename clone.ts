export function shallowClone(value: any) {
  const type = typeof value;
  switch (type) {
    case "object":
      if (!value) {
        return value;
      }

      if (value instanceof Date || value instanceof RegExp) {
        return value;
      }
      return { ...value };
    default:
      return value;
  }
}
export function shallowMerge(value: any, mergeWith: any) {
  const type = typeof value;
  switch (type) {
    case "object":
      if (!value) {
        return shallowClone(mergeWith);
      }

      if (value instanceof Date || value instanceof RegExp) {
        return mergeWith;
      }
      return { ...value, ...mergeWith };
    default:
      return shallowClone(mergeWith);
  }
}
