import type { Config } from "drizzle-kit";
import { config } from "dotenv";
import { resolve } from "path";

try {
  config({ path: resolve(process.cwd(), ".env.local"), override: true });
} catch {}

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
