import type { Config } from "drizzle-kit";
import { readFileSync } from "fs";
import { resolve } from "path";

// Charger .env.local manuellement pour drizzle-kit
try {
  const envLocal = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
  for (const line of envLocal.split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const val = match[2].trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = val;
    }
  }
} catch {}

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
