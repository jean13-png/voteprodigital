"use server";

import { signIn, signOut } from "@/lib/auth";
import { AuthError } from "next-auth";

// Retourne undefined en cas de succès (le client force un rechargement complet).
// Retourne { error } en cas d'échec (le client affiche le message).
export async function adminLogin(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    await signIn("admin", {
      email,
      password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email ou mot de passe incorrect." };
    }
    throw error;
  }
  // Cookie JWT défini par NextAuth dans la réponse. On retourne sans rediriger
  // pour que le client puisse forcer un rechargement complet (évite la boucle
  // de redirection client/serveur).
  return { success: true };
}

export async function candidateLogin(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    await signIn("candidate", {
      email,
      password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email ou mot de passe incorrect." };
    }
    throw error;
  }
  return { success: true };
}

export async function logout(redirectTo = "/") {
  await signOut({ redirectTo });
}