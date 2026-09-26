CREATE TYPE "public"."domaine" AS ENUM('bureautique', 'graphisme', 'developpement_web', 'ecommerce', 'audiovisuel', 'tout');--> statement-breakpoint
CREATE TYPE "public"."vote_statut" AS ENUM('en_attente', 'valide', 'refuse');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_id" integer NOT NULL,
	"action" varchar(100) NOT NULL,
	"target_type" varchar(50) NOT NULL,
	"target_id" integer,
	"details" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "candidates" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(255) NOT NULL,
	"nom" varchar(255) NOT NULL,
	"email" varchar(255),
	"password" text,
	"generated_password" text,
	"photo" text,
	"photo_affiche" text,
	"bio" text,
	"domaine" "domaine" NOT NULL,
	"video_url" text,
	"project_title" text,
	"project_description" text,
	"project_video_url" text,
	"project_image" text,
	"project_poster_image" text,
	"project_links" text,
	"actif" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "candidates_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "contact_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"nom" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"telephone" varchar(255),
	"message" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "formation_inscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"nom" varchar(255) NOT NULL,
	"telephone" varchar(255) NOT NULL,
	"email" varchar(255),
	"formation" varchar(255) NOT NULL,
	"message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" text NOT NULL,
	"role" varchar(50) DEFAULT 'admin' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"candidate_id" integer NOT NULL,
	"nom_votant" varchar(255) NOT NULL,
	"telephone" varchar(20) NOT NULL,
	"email" varchar(255),
	"nombre_votes" integer NOT NULL,
	"montant" integer NOT NULL,
	"preuve" text,
	"fedapay_transaction_id" varchar(255),
	"fedapay_reference" varchar(255),
	"fedapay_status" varchar(50),
	"statut" "vote_statut" DEFAULT 'en_attente' NOT NULL,
	"commentaire_admin" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"event" varchar(100) NOT NULL,
	"status" integer NOT NULL,
	"signature_received" text,
	"signature_format" varchar(50),
	"signature_valid" boolean,
	"payload" text,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;