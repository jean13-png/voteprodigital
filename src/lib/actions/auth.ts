"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";
import { cookies } from "next/headers";
import { createHmac } from "crypto";

export async function adminLogin(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Veuillez fournir email et mot de passe." };
  }

  try {
    // Perform server-side admin authentication (bypass NextAuth cookie issues)
    // Query the credentials provider via signIn for side-effects if available,
    // but also set a signed `pd_admin` cookie here for the API routes to validate.
    const result = await signIn("admin", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      return { error: "Identifiant incorrect ou non autorisé." };
    }

    // Create a signed admin cookie accessible to server routes.
    try {
      const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "";
      const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      const expires = Date.now() + maxAge;
      // We include email and expiry in payload
      const payload = `${email}|${expires}`;
      const sig = createHmac('sha256', secret).update(payload).digest('base64url');
      const token = `${payload}.${sig}`;
      cookies().set({ name: 'pd_admin', value: token, httpOnly: true, path: '/', sameSite: 'lax' });
    } catch (e) {
      console.error('adminLogin: failed to set pd_admin cookie', e);
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

  try {
    const result = await signIn("candidate", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      return { error: "Email ou mot de passe incorrect." };
    }
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email ou mot de passe incorrect." };
    }
    return { error: "Erreur serveur." };
  }
  return { success: true };
}

export async function logout(redirectTo = "/") {
  await signOut({ redirectTo });
}
