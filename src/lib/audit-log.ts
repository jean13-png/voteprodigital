import { db } from "@/db";
import { auditLogs } from "@/db/schema";

export async function auditLog(input: {
  adminId: number;
  action: string;
  targetType: string;
  targetId?: number;
  details?: string;
}) {
  try {
    await db.insert(auditLogs).values({
      adminId: input.adminId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId ?? null,
      details: input.details ?? null,
    });
  } catch {
    // Silently fail — audit log must not break operations
  }
}
