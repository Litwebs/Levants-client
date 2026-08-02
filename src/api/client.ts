function getDefaultApiBaseUrl(): string {
  return import.meta.env.DEV
    ? 'http://localhost:5001/api'
    : 'https://api.levantsdairy.co.uk/api';
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || getDefaultApiBaseUrl();

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

export function resolveApiUrl(pathOrUrl: string): string {
  const value = String(pathOrUrl || "").trim();
  if (!value) return value;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;

  const apiOrigin = API_BASE_URL.replace(/\/api\/?$/, "");
  const normalizedPath = value.startsWith("/") ? value : `/${value}`;
  return `${apiOrigin}${normalizedPath}`;
}

type QueryParamPrimitive = string | number | boolean;
type QueryParamValue = QueryParamPrimitive | QueryParamPrimitive[] | undefined;

interface RequestOptions extends RequestInit {
  params?: Record<string, QueryParamValue>;
}

let refreshInFlight: Promise<boolean> | null = null;

async function tryRefreshCustomerSession(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/portal/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
        },
      });
      return response.ok;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options;

  let url = `${API_BASE_URL}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined) return;
      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (item !== undefined) searchParams.append(key, String(item));
        });
        return;
      }
      searchParams.append(key, String(value));
    });
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  const headers = new Headers(fetchOptions.headers);
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  const hasRetried = headers.get('x-auth-retry') === '1';

  const hasBody = fetchOptions.body !== undefined && fetchOptions.body !== null;
  const isFormData = fetchOptions.body instanceof FormData;
  if (hasBody && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response = await fetch(url, {
    ...fetchOptions,
    headers,
    credentials: 'include'

  });
  if (
    response.status === 401 &&
    !hasRetried &&
    !endpoint.includes('/portal/auth/refresh')
  ) {
    const refreshed = await tryRefreshCustomerSession();
    if (refreshed) {
      headers.set('x-auth-retry', '1');
      response = await fetch(url, {
        ...fetchOptions,
        headers,
        credentials: 'include'
      });
    }
  }

  if (!response.ok) {
    const contentType = response.headers.get('content-type') || '';
    const errorBody = contentType.includes('application/json')
      ? await response.json().catch(() => ({}))
      : await response.text().catch(() => '');

    const errorMessage =
      typeof (errorBody as any)?.message === 'string'
        ? (errorBody as any).message
        : typeof errorBody === 'string' && errorBody
          ? errorBody
          : `Request failed with status ${response.status}`;

    throw new ApiError(
      errorMessage,
      response.status,
      errorBody,
    );
  }

  const responseContentType = response.headers.get('content-type') || '';
  if (!responseContentType.includes('application/json')) {
    // Consumers expect JSON; return an empty object for non-JSON/empty bodies.
    return {} as T;
  }

  return response.json();
}

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

const api = {
  get: <T>(endpoint: string, params?: Record<string, QueryParamValue>) =>
    request<T>(endpoint, { method: 'GET', params }),

  post: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  postForm: <T>(endpoint: string, formData: FormData) =>
    request<T>(endpoint, {
      method: 'POST',
      body: formData,
    }),

  put: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: 'DELETE',
      body: body ? JSON.stringify(body) : undefined,
    }),
};

export default api;

/**
 * Build a full file/image URL from a file ID.
 */
export function getFileUrl(fileId: string): string {
  return `${API_BASE_URL}/files/${fileId}`;
}

type ImageRef =
  | string
  | {
      url?: string | null;
      _id?: string;
      id?: string;
    }
  | null
  | undefined;

/**
 * Resolve an image reference coming from the API into a usable URL.
 *
 * Supports:
 * - Cloudinary-style objects: { url: "https://..." }
 * - Direct URLs ("https://..." / "data:..." / "blob:...")
 * - Backend file IDs (falls back to getFileUrl)
 */
export function resolveImageUrl(ref: ImageRef): string | undefined {
  if (!ref) return undefined;

  if (typeof ref === 'string') {
    const trimmed = ref.trim();
    if (!trimmed) return undefined;
    if (
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('data:') ||
      trimmed.startsWith('blob:')
    ) {
      return trimmed;
    }
    return getFileUrl(trimmed);
  }

  if (typeof ref === 'object') {
    if (typeof ref.url === 'string' && ref.url.trim()) return ref.url.trim();
    if (typeof ref._id === 'string' && ref._id.trim()) return getFileUrl(ref._id.trim());
    if (typeof ref.id === 'string' && ref.id.trim()) return getFileUrl(ref.id.trim());
  }

  return undefined;
}
