// Local copy of setBaseUrl for standalone EAS builds
let _baseUrl: string | null = null;

export function setBaseUrl(url: string | null): void {
  _baseUrl = url ? url.replace(/\/+$/, '') : null;
}

export function getBaseUrl(): string | null {
  return _baseUrl;
}
