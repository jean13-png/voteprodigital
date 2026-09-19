import { DOMAINES } from "@/lib/constants";

const domaineColors: Record<string, string> = {
  bureautique: "bg-blue-50 text-blue-700 border-blue-100",
  graphisme: "bg-purple-50 text-purple-700 border-purple-100",
  developpement_web: "bg-emerald-50 text-emerald-700 border-emerald-100",
  ecommerce: "bg-orange-50 text-orange-700 border-orange-100",
  audiovisuel: "bg-red-50 text-red-700 border-red-100",
};

export default function DomaineBadge({ domaine }: { domaine: string }) {
  const colorClass =
    domaineColors[domaine] ?? "bg-gray-50 text-gray-700 border-gray-100";
  const label = DOMAINES[domaine] ?? domaine;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}
    >
      {label}
    </span>
  );
}
