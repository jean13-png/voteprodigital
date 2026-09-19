import crypto from "crypto";

export const CSRF_COOKIE = "x-csrf-token";
export const CSRF_HEADER = "X-CSRF-Token";

export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function verifyCsrf(
  token: string | null | undefined,
  cookieValue: string | null | undefined
): boolean {
  if (!token || !cookieValue) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(cookieValue));
  } catch {
    return false;
  }
}

export function getCsrfFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${CSRF_COOKIE}=([^;]+)`)
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export async function csrfFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getCsrfFromCookie();
  const headers = new Headers(options.headers ?? {});
  if (token) {
    headers.set(CSRF_HEADER, token);
  }
  return fetch(url, { ...options, headers });
}
