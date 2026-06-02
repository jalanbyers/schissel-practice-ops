/**
 * Thin wrapper around fetch for client-component API calls.
 *
 * Routes through /api/data/* (the BFF proxy) so the Auth0 token is
 * retrieved server-side and never exposed in the browser.
 */
export async function clientFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const res = await fetch(`/api/data${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
  return res;
}

export async function clientJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await clientFetch(path, init);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}
