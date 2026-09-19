interface ResetTokenEntry {
  email: string;
  expiry: number;
}

const store = new Map<string, ResetTokenEntry>();

export function createResetToken(email: string): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const token = Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  store.set(token, { email, expiry: Date.now() + 3600000 });
  return token;
}

export function verifyResetToken(token: string): string | null {
  const entry = store.get(token);
  if (!entry || Date.now() > entry.expiry) {
    store.delete(token);
    return null;
  }
  return entry.email;
}
