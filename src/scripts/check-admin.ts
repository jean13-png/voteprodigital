import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, "admin@prodigitalcenter.com"));
  console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);