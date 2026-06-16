export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function fetchJson<T = unknown>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(input, init);
  } catch {
    throw new ApiError('לא ניתן להתחבר לשרת — ודא שהשרת פועל', 0);
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = typeof body.error === 'string' ? body.error : 'שגיאה — נסה שוב';
    throw new ApiError(msg, res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
