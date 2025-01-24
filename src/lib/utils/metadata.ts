export function asCustomKey(key: string): `custom_${string}` {
  return `custom_${key}` as `custom_${string}`;
}
