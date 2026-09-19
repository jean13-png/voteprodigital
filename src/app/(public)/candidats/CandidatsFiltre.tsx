"use client";

import { useRouter, usePathname } from "next/navigation";

interface Props {
  domaines: Record<string, string>;
  selected: string;
  counts: Record<string, number>;
  total: number;
}

export default function CandidatsFiltre({
  domaines,
  selected,
  counts,
  total,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();

  function handleSelect(domaine: string) {
    const params = new URLSearchParams();
    if (domaine !== "tous") params.set("domaine", domaine);
    router.push(`${pathname}${params.toString() ? `?${params}` : ""}`);
  }

  const filters = [
    { key: "tous", label: "Tous", count: total },
    ...Object.entries(domaines).map(([key, label]) => ({
      key,
      label,
      count: counts[key] ?? 0,
    })),
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {filters.map((f) => (
        <button
          key={f.key}
          onClick={() => handleSelect(f.key)}
          className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            selected === f.key
              ? "bg-[#1B2A6B] text-white border-[#1B2A6B]"
              : "bg-white text-gray-600 border-gray-200 hover:border-[#1B2A6B] hover:text-[#1B2A6B]"
          }`}
        >
          {f.label}
          <span
            className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
              selected === f.key
                ? "bg-white/20 text-white"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {f.count}
          </span>
        </button>
      ))}
    </div>
  );
}
