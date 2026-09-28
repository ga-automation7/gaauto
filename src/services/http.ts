/**
 * Thin fetch wrapper for the future GA Automations API.
 * Keeps base URL, JSON handling, timeouts and error shape in one place.
 */
import { env } from '@/config/env';

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function postJson<T = unknown>(url: string, body: unknown, timeoutMs = 12000): Promise<T> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url.startsWith('http') ? url : `${env.apiBaseUrl}${url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) throw new HttpError(res.status, `Request failed (${res.status})`);
    const text = await res.text();
    return (text ? JSON.parse(text) : {}) as T;
  } finally {
    window.clearTimeout(timer);
  }
}
