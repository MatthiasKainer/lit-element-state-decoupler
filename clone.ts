export function shallowClone(value: any) {
  if (typeof value !== "object" || !value || value instanceof Date || value instanceof RegExp) return value
  return (Array.isArray(value)) ? [...value] : { ...value }
}