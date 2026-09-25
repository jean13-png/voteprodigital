import { redirect } from "next/navigation";

export default function CandidatInscriptionDisabledPage() {
  redirect("/candidat/login");
}
