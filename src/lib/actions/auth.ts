"use server";

import { signIn, signOut } from "@/lib/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

export async function adminLogin(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    await signIn("admin", {
      email,
      password,
      redirectTo: "/admin/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email ou mot de passe incorrect." };
    }
    throw error;
  }
}

export async function candidateLogin(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    await signIn("candidate", {
      email,
      password,
      redirectTo: "/candidat/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email ou mot de passe incorrect." };
    }
    throw error;
  }
}

export async function logout(redirectTo = "/") {
  await signOut({ redirectTo });
  redirect(redirectTo);
}
