import { db, candidates, votes } from "@/db";
import { eq, desc, sql, and, ilike, or } from "drizzle-orm";

// Ré-exporter les constantes depuis constants.ts (server-side uniquement)
export { VOTE_PRICE, VOTE_OBJECTIF, SOUTENANCE_DATE, DOMAINES } from "@/lib/constants";

// ─── Nombre de candidats ──────────────────────────────────────────────

export async function getCandidatesCount(): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(candidates);
  return Number(row?.count ?? 0);
}

// ─── Classement candidats (votes validés) ─────────────────────────────────────

export async function getCandidatesRanked(limit?: number) {
  const query = db
    .select({
      id: candidates.id,
      slug: candidates.slug,
      nom: candidates.nom,
      photo: candidates.photo,
      photoAffiche: candidates.photoAffiche,
      bio: candidates.bio,
      domaine: candidates.domaine,
      videoUrl: candidates.videoUrl,
      projectTitle: candidates.projectTitle,
      projectDescription: candidates.projectDescription,
      projectVideoUrl: candidates.projectVideoUrl,
      projectImage: candidates.projectImage,
      projectPosterImage: candidates.projectPosterImage,
      projectLinks: candidates.projectLinks,
      actif: candidates.actif,
      totalVotes: sql<number>`COALESCE(SUM(CASE WHEN ${votes.statut} = 'valide' THEN ${votes.nombreVotes} ELSE 0 END), 0)`.as(
        "total_votes"
      ),
    })
    .from(candidates)
    .leftJoin(votes, eq(votes.candidateId, candidates.id))
    .where(eq(candidates.actif, true))
    .groupBy(candidates.id)
    .orderBy(
      desc(
        sql`COALESCE(SUM(CASE WHEN ${votes.statut} = 'valide' THEN ${votes.nombreVotes} ELSE 0 END), 0)`
      )
    );

  if (limit) {
    return await query.limit(limit);
  }
  return await query;
}

// ─── Candidats paginés + recherche (page d'accueil) ──────────────────────────

export async function getCandidatesRankedPaginated(options: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  const { page = 1, limit = 8, search = "" } = options;
  const offset = (page - 1) * limit;

  const searchCondition = search
    ? and(
        eq(candidates.actif, true),
        or(
          ilike(candidates.nom, `%${search}%`),
          ilike(candidates.domaine, `%${search}%`)
        )
      )
    : eq(candidates.actif, true);

  const [rows, countRes] = await Promise.all([
    db
      .select({
        id: candidates.id,
        slug: candidates.slug,
        nom: candidates.nom,
        photo: candidates.photo,
        photoAffiche: candidates.photoAffiche,
        bio: candidates.bio,
        domaine: candidates.domaine,
        videoUrl: candidates.videoUrl,
        projectTitle: candidates.projectTitle,
        projectDescription: candidates.projectDescription,
        projectVideoUrl: candidates.projectVideoUrl,
        projectImage: candidates.projectImage,
        projectPosterImage: candidates.projectPosterImage,
        projectLinks: candidates.projectLinks,
        actif: candidates.actif,
        totalVotes: sql<number>`COALESCE(SUM(CASE WHEN ${votes.statut} = 'valide' THEN ${votes.nombreVotes} ELSE 0 END), 0)`.as("total_votes"),
      })
      .from(candidates)
      .leftJoin(votes, eq(votes.candidateId, candidates.id))
      .where(searchCondition)
      .groupBy(candidates.id)
      .orderBy(desc(sql`COALESCE(SUM(CASE WHEN ${votes.statut} = 'valide' THEN ${votes.nombreVotes} ELSE 0 END), 0)`))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`COUNT(DISTINCT ${candidates.id})` })
      .from(candidates)
      .where(searchCondition),
  ]);

  const total = Number(countRes[0]?.count ?? 0);

  return {
    candidats: rows,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
  };
}

// ─── Un candidat par slug ─────────────────────────────────────────────────────

export async function getCandidateBySlug(slug: string) {
  const result = await db
    .select({
      id: candidates.id,
      slug: candidates.slug,
      nom: candidates.nom,
      email: candidates.email,
      photo: candidates.photo,
      photoAffiche: candidates.photoAffiche,
      bio: candidates.bio,
      domaine: candidates.domaine,
      videoUrl: candidates.videoUrl,
      projectTitle: candidates.projectTitle,
      projectDescription: candidates.projectDescription,
      projectVideoUrl: candidates.projectVideoUrl,
      projectImage: candidates.projectImage,
      projectPosterImage: candidates.projectPosterImage,
      projectLinks: candidates.projectLinks,
      actif: candidates.actif,
      totalVotes: sql<number>`COALESCE(SUM(CASE WHEN ${votes.statut} = 'valide' THEN ${votes.nombreVotes} ELSE 0 END), 0)`.as(
        "total_votes"
      ),
      votesEnAttente: sql<number>`COALESCE(SUM(CASE WHEN ${votes.statut} = 'en_attente' THEN ${votes.nombreVotes} ELSE 0 END), 0)`.as(
        "votes_en_attente"
      ),
    })
    .from(candidates)
    .leftJoin(votes, eq(votes.candidateId, candidates.id))
    .where(and(eq(candidates.slug, slug), eq(candidates.actif, true)))
    .groupBy(candidates.id);

  return result[0] ?? null;
}

// ─── Candidat par ID (admin) ──────────────────────────────────────────────────

export async function getCandidateById(id: number) {
  const result = await db
    .select()
    .from(candidates)
    .where(eq(candidates.id, id));
  return result[0] ?? null;
}

// ─── Stats dashboard admin ────────────────────────────────────────────────────

export async function getAdminStats() {
  const [totalVotesRes, enAttenteRes, validesRes, candidatsRes, montantRes] =
    await Promise.all([
      db
        .select({ count: sql<number>`COUNT(*)` })
        .from(votes),
      db
        .select({ count: sql<number>`COUNT(*)` })
        .from(votes)
        .where(eq(votes.statut, "en_attente")),
      db
        .select({ count: sql<number>`COUNT(*)` })
        .from(votes)
        .where(eq(votes.statut, "valide")),
      db.select({ count: sql<number>`COUNT(*)` }).from(candidates),
      db
        .select({ total: sql<number>`COALESCE(SUM(${votes.montant}), 0)` })
        .from(votes)
        .where(eq(votes.statut, "valide")),
    ]);

  return {
    totalVotes: Number(totalVotesRes[0]?.count ?? 0),
    enAttente: Number(enAttenteRes[0]?.count ?? 0),
    valides: Number(validesRes[0]?.count ?? 0),
    candidats: Number(candidatsRes[0]?.count ?? 0),
    montantTotal: Number(montantRes[0]?.total ?? 0),
  };
}

// ─── Derniers votes (admin dashboard) ────────────────────────────────────────

export async function getDerniersVotes(limit = 10) {
  return db
    .select({
      id: votes.id,
      nomVotant: votes.nomVotant,
      telephone: votes.telephone,
      nombreVotes: votes.nombreVotes,
      montant: votes.montant,
      statut: votes.statut,
      createdAt: votes.createdAt,
      candidatNom: candidates.nom,
      candidatSlug: candidates.slug,
    })
    .from(votes)
    .innerJoin(candidates, eq(votes.candidateId, candidates.id))
    .orderBy(desc(votes.createdAt))
    .limit(limit);
}

// ─── Liste votes admin (avec filtre / recherche) ──────────────────────────────

export async function getVotesList(options: {
  statut?: "en_attente" | "valide" | "refuse" | "all";
  search?: string;
  page?: number;
  limit?: number;
}) {
  const { statut = "all", search = "", page = 1, limit = 15 } = options;
  const offset = (page - 1) * limit;

  const conditions = [];

  if (statut !== "all") {
    conditions.push(eq(votes.statut, statut));
  }

  if (search) {
    conditions.push(
      or(
        ilike(votes.nomVotant, `%${search}%`),
        ilike(votes.telephone, `%${search}%`),
        ilike(candidates.nom, `%${search}%`)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, countRes] = await Promise.all([
    db
      .select({
        id: votes.id,
        nomVotant: votes.nomVotant,
        telephone: votes.telephone,
        nombreVotes: votes.nombreVotes,
        montant: votes.montant,
        statut: votes.statut,
        preuve: votes.preuve,
        commentaireAdmin: votes.commentaireAdmin,
        createdAt: votes.createdAt,
        candidatId: candidates.id,
        candidatNom: candidates.nom,
        candidatSlug: candidates.slug,
      })
      .from(votes)
      .innerJoin(candidates, eq(votes.candidateId, candidates.id))
      .where(whereClause)
      .orderBy(desc(votes.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`COUNT(*)` })
      .from(votes)
      .innerJoin(candidates, eq(votes.candidateId, candidates.id))
      .where(whereClause),
  ]);

  return {
    votes: rows,
    total: Number(countRes[0]?.count ?? 0),
    page,
    totalPages: Math.ceil(Number(countRes[0]?.count ?? 0) / limit),
  };
}

// ─── Votes d'un candidat (espace candidat) ───────────────────────────────────

export async function getVotesByCandidate(
  candidateId: number,
  limit = 20
) {
  return db
    .select()
    .from(votes)
    .where(eq(votes.candidateId, candidateId))
    .orderBy(desc(votes.createdAt))
    .limit(limit);
}

export async function getCandidateVoteStats(candidateId: number) {
  const result = await db
    .select({
      totalVotes: sql<number>`COALESCE(SUM(CASE WHEN ${votes.statut} = 'valide' THEN ${votes.nombreVotes} ELSE 0 END), 0)`,
      votesEnAttente: sql<number>`COALESCE(SUM(CASE WHEN ${votes.statut} = 'en_attente' THEN ${votes.nombreVotes} ELSE 0 END), 0)`,
      totalTransactions: sql<number>`COUNT(*)`,
    })
    .from(votes)
    .where(eq(votes.candidateId, candidateId));

  return result[0];
}
