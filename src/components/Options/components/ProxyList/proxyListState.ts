import type {ConfigProxy} from '../../../../tools/index';

export function getProxyDropOffset(
  proxies: readonly Pick<ConfigProxy, 'id'>[],
  proxyId: string,
  targetProxyId: string,
  position: 'before' | 'after',
): number {
  const sourceIndex = proxies.findIndex((proxy) => proxy.id === proxyId);
  const targetIndex = proxies.findIndex((proxy) => proxy.id === targetProxyId);
  if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) return 0;

  const insertionIndex = targetIndex + (position === 'after' ? 1 : 0);
  const adjustedInsertionIndex = insertionIndex - (sourceIndex < insertionIndex ? 1 : 0);
  return adjustedInsertionIndex - sourceIndex;
}
