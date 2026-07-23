import { getToken } from "./auth-storage";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
    public requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type FetchOptions = RequestInit & {
  retry?: number;
  auth?: boolean;
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { retry = 3, auth = true, headers, ...rest } = options;
  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retry) {
    const hdrs = new Headers(headers);
    if (!hdrs.has("content-type") && rest.body) {
      hdrs.set("content-type", "application/json");
    }
    if (auth) {
      const token = getToken();
      if (token) hdrs.set("authorization", `Bearer ${token}`);
    }

    try {
      const res = await fetch(`${API_URL}${path}`, {
        ...rest,
        headers: hdrs,
      });

      const requestId = res.headers.get("x-request-id") ?? undefined;
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const code = (data as { code?: string }).code ?? "ERROR";
        const message =
          (data as { message?: string }).message ?? res.statusText;

        // Never auto-retry seat conflicts
        if (res.status === 409 || code === "SEATS_UNAVAILABLE") {
          throw new ApiError(
            res.status,
            code,
            message,
            (data as { details?: unknown }).details,
            requestId,
          );
        }

        const transient =
          res.status === 429 || res.status === 503 || res.status >= 500;
        if (transient && attempt < retry) {
          attempt += 1;
          await sleep(200 * 2 ** (attempt - 1));
          continue;
        }

        throw new ApiError(
          res.status,
          code,
          message,
          (data as { details?: unknown }).details,
          requestId,
        );
      }

      return data as T;
    } catch (err) {
      lastError = err;
      if (err instanceof ApiError) throw err;
      if (attempt < retry) {
        attempt += 1;
        await sleep(200 * 2 ** (attempt - 1));
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}

export function getApiUrl() {
  return API_URL;
}
