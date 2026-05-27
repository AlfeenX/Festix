const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refreshToken');
}

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    return false;
  }

  const data = await res.json();
  if (!data?.accessToken || !data?.refreshToken) {
    return false;
  }

  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  return true;
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
  retryOnAuthFailure = true
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const text = await res.text();
  const contentType = res.headers.get('content-type') || '';

  let data: any;
  if (contentType.includes('application/json')) {
    try {
      data = JSON.parse(text);
    } catch (err) {
      throw new Error(
        `Invalid JSON response from ${res.url} (${res.status} ${res.statusText}): ${text.slice(0, 300)}`
      );
    }
  } else {
    throw new Error(
      `Unexpected response type from ${res.url} (${res.status} ${res.statusText}) - expected JSON but got ${contentType}: ${text.slice(0, 300)}`
    );
  }

  if (res.status === 401 && retryOnAuthFailure && path !== '/auth/refresh') {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return api<T>(path, options, false);
    }
  }

  if (!res.ok) throw new Error(data?.error || data?.message || `Request failed: ${res.status}`);
  return data as T;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  banner_url?: string;
  venue_id?: string;
  starts_at: string;
  ends_at: string;
  is_published?: boolean;
  venue_name?: string;
  venue_city?: string;
  available_seats?: number;
}

export interface Venue {
  id: string;
  name: string;
  address?: string;
  city?: string;
  capacity?: number;
}

export interface Seat {
  id: string;
  row_label: string;
  seat_number: number;
  category: string;
  price: number;
  status: string;
}

export interface Order {
  id: string;
  event_id: string;
  status: string;
  total_amount: number;
  created_at?: string;
  event_title?: string;
  items?: { seat_id: string; price: number; row_label?: string; seat_number?: number }[];
}
