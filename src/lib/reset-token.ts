import crypto from "crypto";

interface ResetTokenEntry {
  email: string;
  expiry: number;
}

const store = new Map<string, ResetTokenEntry>();

export function createResetToken(email: string): string {
  const token = crypto.randomBytes(32).toString("hex");
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
