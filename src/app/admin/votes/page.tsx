import { getVotesList } from "@/lib/db-queries";
import VotesTable from "./VotesTable";

export const dynamic = "force-dynamic";

export default async function AdminVotesPage({
  searchParams,
}: {
  searchParams: Promise<{
    statut?: string;
    search?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const statut = (params.statut as "en_attente" | "valide" | "refuse" | "all") ?? "all";
  const search = params.search ?? "";
  const page = parseInt(params.page ?? "1");

  const data = await getVotesList({ statut, search, page, limit: 15 });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#1B2A6B]">
          Gestion des votes
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Vérifiez les preuves de paiement et validez ou refusez les votes.
        </p>
      </div>
      <VotesTable data={data} currentStatut={statut} currentSearch={search} />
    </div>
  );
}
