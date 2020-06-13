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