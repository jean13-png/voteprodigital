import util from "util";

export function logError(context: string, err: unknown): void {
  try {
    if (err instanceof Error) {
      console.error(`[${context}] ${err.stack || err.message}`);
    } else {
      // pretty-print objects
      console.error(`[${context}] ${util.inspect(err, { depth: 5, colors: false })}`);
    }
  } catch (e) {
    console.error(`[${context}] (error logging failed) ${String(e)}`);
  }
}
