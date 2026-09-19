export function logError(context: string, err: unknown): void {
  if (err instanceof Error) {
    console.error(`[${context}] ${err.message}`);
  } else {
    console.error(`[${context}] ${String(err)}`);
  }
}
