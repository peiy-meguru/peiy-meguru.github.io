export function resolveImage(
  src: string | undefined,
  base: string,
  fallback: string
): { src: string; fallback: string } {
  const resolve = (url: string) =>
    url.startsWith('http') || url.startsWith('//')
      ? url
      : base + url.replace(/^\//, '');

  const resolvedFallback = resolve(fallback);

  if (!src) {
    return { src: resolvedFallback, fallback: resolvedFallback };
  }

  return { src: resolve(src), fallback: resolvedFallback };
}
