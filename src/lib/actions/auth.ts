"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";
import { cookies, headers } from "next/headers";
import { createHmac } from "crypto";
import { checkRateLimit, resetRateLimit, getClientIp } from "@/lib/rate-limit";

export async function adminLogin(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Veuillez fournir email et mot de passe." };
  }

  // Rate limiting: check by IP and email
  const headersList = await headers();
  const clientIp = getClientIp(headersList);
  const identifier = `${clientIp}:${email}`;

  const rateLimit = checkRateLimit(identifier, {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  });

  if (!rateLimit.allowed) {
    const minutesLeft = Math.ceil((rateLimit.resetTime - Date.now()) / 60000);
    return {
      error: `Trop de tentatives. Réessayez dans ${minutesLeft} minute${minutesLeft > 1 ? "s" : ""}.`,
    };
  }

  try {
    // Perform server-side admin authentication
    const result = await signIn("admin", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      return { error: "Identifiant incorrect ou non autorisé." };
    }

    // Success: reset rate limit for this identifier
    resetRateLimit(identifier);

    // Create a signed admin cookie accessible to server routes.
    try {
      const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "";
      const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      const expires = Date.now() + maxAge;
      // We include email and expiry in payload
      const payload = `${email}|${expires}`;
      const sig = createHmac("sha256", secret).update(payload).digest("base64url");
      const token = `${payload}.${sig}`;
      const cookieStore = await cookies();
      cookieStore.set({
        name: "pd_admin",
        value: token,
        httpOnly: true,
        path: "/",
        sameSite: "lax",
      });
    } catch (e) {
      console.error("adminLogin: failed to set pd_admin cookie", e);
    }

    return { success: true };
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Identifiant incorrect ou non autorisé." };
    }
    console.error("adminLogin error:", err);
    return { error: "Erreur serveur, réessayez plus tard." };
  }
}

export async function candidateLogin(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Veuillez fournir email et mot de passe." };
  }

  // Rate limiting: check by IP and email
  const headersList = await headers();
  const clientIp = getClientIp(headersList);
  const identifier = `candidate:${clientIp}:${email}`;

  const rateLimit = checkRateLimit(identifier, {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  });

  if (!rateLimit.allowed) {
    const minutesLeft = Math.ceil((rateLimit.resetTime - Date.now()) / 60000);
    return {
      error: `Trop de tentatives. Réessayez dans ${minutesLeft} minute${minutesLeft > 1 ? "s" : ""}.`,
    };
  }

  try {
    const result = await signIn("candidate", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      return { error: "Email ou mot de passe incorrect." };
    }

    // Success: reset rate limit
    resetRateLimit(identifier);

    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email ou mot de passe incorrect." };
    }
    return { error: "Erreur serveur." };
  }
}

export async function logout(redirectTo = "/") {
  await signOut({ redirectTo });
}
