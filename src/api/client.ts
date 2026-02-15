const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options;

  let url = `${API_BASE_URL}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new ApiError(
      errorBody.message || `Request failed with status ${response.status}`,
      response.status,
      errorBody,
    );
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
  get: <T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>) =>
    request<T>(endpoint, { method: 'GET', params }),

  post: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string) =>
    request<T>(endpoint, { method: 'DELETE' }),
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
