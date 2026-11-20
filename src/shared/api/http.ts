export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly url: string,
  ) {
    super(`Request to ${new URL(url).host} failed with status ${status}`)
    this.name = 'HttpError'
  }
}

type Params = Record<string, string | number | boolean | undefined>

export function buildUrl(base: string, params: Params = {}): string {
  const url = new URL(base)
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, String(value))
  }
  return url.toString()
}

export async function getJson<T>(base: string, params?: Params, init?: RequestInit): Promise<T> {
  const url = buildUrl(base, params)
  const response = await fetch(url, { headers: { Accept: 'application/json' }, ...init })
  if (!response.ok) throw new HttpError(response.status, url)
  return (await response.json()) as T
}
