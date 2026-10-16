const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export interface ApiError {
  status: number;
  message: string;
  details?: unknown;
}

export class ApiRequestError extends Error {
  status: number;
  details?: unknown;
  constructor(err: ApiError) {
    super(err.message);
    this.status = err.status;
    this.details = err.details;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    let body: { message?: unknown } | null = null;
    try {
      body = await res.json();
    } catch {
      /* ignore non-JSON body */
    }

    const rawMsg = body?.message;
    const message = Array.isArray(rawMsg)
      ? rawMsg.join(', ')
      : typeof rawMsg === 'string'
        ? rawMsg
        : `Request failed with status ${res.status}`;

    throw new ApiRequestError({
      status: res.status,
      message,
      details: body,
    });
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
