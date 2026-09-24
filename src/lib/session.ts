import { jwtVerify, jwtDecrypt } from "jose";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createHash } from "crypto";

const JWT_COOKIE = "next-auth.session-token";

// Le secret doit être le même que celui utilisé par NextAuth dans auth.ts.
// NextAuth utilise AUTH_SECRET, avec fallback sur NEXTAUTH_SECRET.
function getAuthSecret(): string {
  return process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "";
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(JWT_COOKIE)?.value;
  if (process.env.NODE_ENV !== "production") {
    console.log("[session] getSession cookie token present:", !!token);
  }
  if (!token) return null;

  const secret = getAuthSecret();
  if (!secret) return null;

  try {
    // NextAuth issues an encrypted JWE cookie (alg: dir, enc: A256CBC-HS512).
    // Derive a 64-byte key from the secret (SHA-512) for jwtDecrypt.
    const key = createHash("sha512").update(secret).digest();
    try {
      const { payload } = await jwtDecrypt(token, key as unknown as CryptoKey | Uint8Array);
      return {
        user: {
          id: payload.id as string,
          role: payload.role as string,
          slug: payload.slug as string | undefined,
        },
      };
    } catch (e) {
      // Not a JWE or decryption failed; try signed JWT verify as fallback
      const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
      return {
        user: {
          id: payload.id as string,
          role: payload.role as string,
          slug: payload.slug as string | undefined,
        },
      };
    }

  } catch {
    if (process.env.NODE_ENV !== "production") console.log("[session] jwtVerify failed");
    return null;
  }
}

export async function getSessionFromRequest(req: NextRequest) {
  const token = req.cookies.get(JWT_COOKIE)?.value;
  if (process.env.NODE_ENV !== "production") {
    // NextRequest.cookies is an immutable RequestCookies instance; avoid entries()
    try {
      const cookieNames: string[] = [];
      // Using .get() to check presence of common cookies without enumerating
      if (req.cookies.get(JWT_COOKIE)) cookieNames.push(JWT_COOKIE);
      // log presence of some commonly relevant cookies
      if (req.cookies.get('next-auth.csrf-token')) cookieNames.push('next-auth.csrf-token');
      console.log("[session] getSessionFromRequest cookies present:", cookieNames);
    } catch (e) {
      console.log("[session] cannot read req.cookies", e);
    }
    console.log("[session] token present in request:", !!token);
  }
  if (!token) return null;

  const secret = getAuthSecret();
  if (!secret) return null;

  try {
    // NextAuth uses JWE with A256CBC-HS512 when encryption is enabled.
    // The CEK for A256CBC-HS512 is 64 bytes: first 32 bytes = MAC key, last 32 = ENC key.
    // Derive a 64-byte key from the secret using SHA-512 and use it for jwtDecrypt.
    const cek = createHash("sha512").update(secret).digest();
    try {
      const { payload } = await jwtDecrypt(token, cek as unknown as CryptoKey | Uint8Array);
      return {
        user: {
          id: payload.id as string,
          role: payload.role as string,
          slug: payload.slug as string | undefined,
        },
      };
    } catch (e) {
      // Fallback: try signed JWT (JWS) verification
      try {
        const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
        return {
          user: {
            id: payload.id as string,
            role: payload.role as string,
            slug: payload.slug as string | undefined,
          },
        };
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.log("[session] jwtDecrypt failed and jwtVerify failed", { jwtDecryptError: e, jwtVerifyError: err });
        }
        return null;
      }
    }
  } catch (topErr) {
    if (process.env.NODE_ENV !== "production") console.log("[session] token verification error", topErr);
    return null;
  }
}