import { handlers } from "@/lib/auth";

// Wrapper to add lightweight request logging for debugging sign-in hangs.
export async function GET(req: Request) {
	try {
		console.log('[NextAuth route] GET', req.url);
	} catch (e) {}
	// @ts-ignore
	return handlers.GET(req as any);
}

export async function POST(req: Request) {
	try {
		console.log('[NextAuth route] POST', req.url);
	} catch (e) {}
	// @ts-ignore
	return handlers.POST(req as any);
}
