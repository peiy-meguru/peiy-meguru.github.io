export function withBase(url: string, base: string): string {
  if (!url) return base;
  if (/^(?:[a-z]+:)?\/\//i.test(url) || url.startsWith("#") || url.startsWith("mailto:") || url.startsWith("tel:")) {
    return url;
  }

  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  if (url === "/") return normalizedBase;
  return `${normalizedBase}${url.replace(/^\/+/, "")}`;
}
