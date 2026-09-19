export const CSRF_COOKIE = "x-csrf-token";
export const CSRF_HEADER = "X-CSRF-Token";

export function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function verifyCsrf(
  token: string | null | undefined,
  cookieValue: string | null | undefined
): boolean {
  if (!token || !cookieValue) return false;
  if (token.length !== cookieValue.length) return false;
  let result = 0;
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ cookieValue.charCodeAt(i);
  }
  return result === 0;
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
