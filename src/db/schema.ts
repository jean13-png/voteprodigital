import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ───────────────────────────────────────────────────────────────────

export const voteStatutEnum = pgEnum("vote_statut", [
  "en_attente",
  "valide",
  "refuse",
]);

export const domaineEnum = pgEnum("domaine", [
  "bureautique",
  "graphisme",
  "developpement_web",
  "ecommerce",
  "audiovisuel",
  "tout",
]);

// ─── Table : users (administrateurs) ─────────────────────────────────────────

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  role: varchar("role", { length: 50 }).notNull().default("admin"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Table : candidates ───────────────────────────────────────────────────────

export const candidates = pgTable("candidates", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  nom: varchar("nom", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  password: text("password"),
  generatedPassword: text("generated_password"),
  photo: text("photo"),
  photoAffiche: text("photo_affiche"),
  bio: text("bio"),
  domaine: domaineEnum("domaine").notNull(),
  videoUrl: text("video_url"),
  projectTitle: text("project_title"),
  projectDescription: text("project_description"),
  projectVideoUrl: text("project_video_url"),
  projectImage: text("project_image"),
  projectPosterImage: text("project_poster_image"),
  projectLinks: text("project_links"),
  actif: boolean("actif").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Table : votes ────────────────────────────────────────────────────────────

export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id")
    .notNull()
    .references(() => candidates.id, { onDelete: "cascade" }),
  nomVotant: varchar("nom_votant", { length: 255 }).notNull(),
  telephone: varchar("telephone", { length: 20 }).notNull(),
  email: varchar("email", { length: 255 }),
  nombreVotes: integer("nombre_votes").notNull(),
  montant: integer("montant").notNull(),
  preuve: text("preuve"),
  fedapayTransactionId: varchar("fedapay_transaction_id", { length: 255 }),
  fedapayReference: varchar("fedapay_reference", { length: 255 }),
  fedapayStatus: varchar("fedapay_status", { length: 50 }),
  statut: voteStatutEnum("statut").notNull().default("en_attente"),
  commentaireAdmin: text("commentaire_admin"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Table : webhook_logs ─────────────────────────────────────────────────────

export const webhookLogs = pgTable("webhook_logs", {
  id: serial("id").primaryKey(),
  event: varchar("event", { length: 100 }).notNull(),
  status: integer("status").notNull(),
  signatureReceived: text("signature_received"),
  signatureFormat: varchar("signature_format", { length: 50 }),
  signatureValid: boolean("signature_valid"),
  payload: text("payload"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Relations ────────────────────────────────────────────────────────────────

export const candidatesRelations = relations(candidates, ({ many }) => ({
  votes: many(votes),
}));

export const votesRelations = relations(votes, ({ one }) => ({
  candidate: one(candidates, {
    fields: [votes.candidateId],
    references: [candidates.id],
  }),
}));

// ─── Table : audit_logs ────────────────────────────────────────────────

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  action: varchar("action", { length: 100 }).notNull(),
  targetType: varchar("target_type", { length: 50 }).notNull(),
  targetId: integer("target_id"),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  admin: one(users, {
    fields: [auditLogs.adminId],
    references: [users.id],
  }),
}));

// ─── Table : formation_inscriptions ──────────────────────────────────────────

export const formationInscriptions = pgTable("formation_inscriptions", {
  id: serial("id").primaryKey(),
  nom: varchar("nom", { length: 255 }).notNull(),
  telephone: varchar("telephone", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  formation: varchar("formation", { length: 255 }).notNull(),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  nom: varchar("nom", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  telephone: varchar("telephone", { length: 255 }),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Types inférés ────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Candidate = typeof candidates.$inferSelect;
export type NewCandidate = typeof candidates.$inferInsert;

export type Vote = typeof votes.$inferSelect;
export type NewVote = typeof votes.$inferInsert;

export type VoteStatut = "en_attente" | "valide" | "refuse";
export type Domaine =
  | "bureautique"
  | "graphisme"
  | "developpement_web"
  | "ecommerce"
  | "audiovisuel"
  | "tout";

export type FormationInscription = typeof formationInscriptions.$inferSelect;
export type NewFormationInscription = typeof formationInscriptions.$inferInsert;

export type ContactMessage = typeof contactMessages.$inferSelect;
export type NewContactMessage = typeof contactMessages.$inferInsert;
