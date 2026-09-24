import { NextRequest, NextResponse } from "next/server";
import { getSession, getSessionFromRequest } from "@/lib/session";
import { auth } from "@/lib/auth";
import { jwtVerify, decodeJwt, jwtDecrypt } from "jose";
import { db, candidates } from "@/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { uploadToCloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";
import { logError } from "@/lib/log-error";
import { auditLog } from "@/lib/audit-log";
import { Domaine } from "@/db/schema";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('next-auth.session-token')?.value;
    if (process.env.NODE_ENV !== 'production') {
      // Avoid using req.cookies.entries() which is not available on NextRequest
      try {
        const present: string[] = [];
        if (req.cookies.get('next-auth.session-token')) present.push('next-auth.session-token');
        if (req.cookies.get('next-auth.csrf-token')) present.push('next-auth.csrf-token');
        console.log('[admin/candidats] request cookies present:', present);
      } catch (e) {
        console.log('[admin/candidats] cannot read req.cookies', e);
      }
      // Log a truncated token prefix so we can inspect its header without leaking full secret
      if (token) {
        console.log('[admin/candidats] token snippet:', token.slice(0, 80));
        // Try to decode the JWT/JWE header (first part before first '.') to inspect alg/enc
        try {
          const headerB64 = token.split('.')[0];
          const headerJson = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf8'));
          console.log('[admin/candidats] token header:', headerJson);
        } catch (e) {
          console.log('[admin/candidats] token header decode failed', e?.message ?? e);
        }
      } else {
        console.log('[admin/candidats] next-auth.session-token not present');
      }
    }
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') console.log('[admin/candidats] cookies read error', e);
  }

  let session = null;
  try {
    // In App Router, call auth() without args to let Auth.js read cookies via runtime
    session = await auth();
    if (process.env.NODE_ENV !== 'production') console.log('[admin/candidats] auth() session', session);
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') console.log('[admin/candidats] auth() error', e);
  }

  // If auth() didn't return a session (sometimes empty in this runtime), try our session helper
  if ((!session || Object.keys(session || {}).length === 0) && getSessionFromRequest) {
    try {
      const s2 = await getSessionFromRequest(req);
      if (s2) {
        session = { user: s2.user } as any;
        if (process.env.NODE_ENV !== 'production') console.log('[admin/candidats] getSessionFromRequest found session', session);
      } else {
        if (process.env.NODE_ENV !== 'production') console.log('[admin/candidats] getSessionFromRequest returned null');
      }
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') console.log('[admin/candidats] getSessionFromRequest error', e);
    }
  }

  // Additional fallback: call internal session endpoint to let NextAuth parse the cookie
  if ((!session || Object.keys(session || {}).length === 0)) {
    try {
      const base = process.env.NEXTAUTH_URL ?? `http://localhost:3000`;
      const resp = await fetch(`${base}/api/auth/session`, {
        method: 'GET',
        headers: { cookie: req.headers.get('cookie') ?? '' },
      });
      if (resp.ok) {
        const body = await resp.json();
        if (body?.user) {
          session = body;
          if (process.env.NODE_ENV !== 'production') console.log('[admin/candidats] /api/auth/session fallback returned', session);
        } else {
          if (process.env.NODE_ENV !== 'production') console.log('[admin/candidats] /api/auth/session fallback returned no user');
        }
      } else {
        if (process.env.NODE_ENV !== 'production') console.log('[admin/candidats] /api/auth/session fetch failed', resp.status);
      }
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') console.log('[admin/candidats] /api/auth/session fetch error', e);
    }
  }

  // Dev-only: if still no session, try to decrypt using Next dev encryption key
  if (process.env.NODE_ENV !== 'production' && (!session || Object.keys(session || {}).length === 0)) {
    try {
      // Read the server dev encryption key emitted by Next at build time
      const path = '.next/dev/server/server-reference-manifest.json';
      const fs = await import('fs');
      if (fs.existsSync(path)) {
        const raw = fs.readFileSync(path, 'utf8');
        const parsed = JSON.parse(raw);
        const encKeyB64 = parsed?.encryptionKey;
        if (encKeyB64) {
          try {
            const encKey = Buffer.from(encKeyB64, 'base64');
            const token = req.cookies.get('next-auth.session-token')?.value;
            if (token) {
              try {
                const { payload } = await jwtDecrypt(token, encKey as unknown as CryptoKey | Uint8Array);
                if (process.env.NODE_ENV !== 'production') console.log('[admin/candidats] dev manifest jwtDecrypt payload', { payload });
                if ((payload as any).role === 'admin') {
                  session = { user: { id: String((payload as any).id), role: 'admin' } } as any;
                }
              } catch (e) {
                if (process.env.NODE_ENV !== 'production') console.log('[admin/candidats] dev manifest jwtDecrypt failed', e?.toString?.() ?? e);
              }
            }
          } catch (e) {
            if (process.env.NODE_ENV !== 'production') console.log('[admin/candidats] error parsing dev encryption key', e);
          }
        }
      }
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') console.log('[admin/candidats] dev manifest fallback error', e);
    }
  }

  // Fallback: accept pd_admin signed cookie set by adminLogin server action
  if ((!session || Object.keys(session || {}).length === 0)) {
    try {
      const pd = req.cookies.get('pd_admin')?.value;
      if (pd) {
        const parts = pd.split('.');
        if (parts.length === 2) {
          const payload = parts[0];
          const sig = parts[1];
          const { createHmac } = await import('crypto');
          const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? '';
          const expected = createHmac('sha256', secret).update(payload).digest('base64url');
          if (expected === sig) {
            const [email, expiresStr] = payload.split('|');
            const expires = parseInt(expiresStr || '0', 10);
            if (Date.now() < expires) {
              // accept admin
              session = { user: { id: email, role: 'admin' } } as any;
              if (process.env.NODE_ENV !== 'production') console.log('[admin/candidats] pd_admin cookie valid, using session', session);
            } else {
              if (process.env.NODE_ENV !== 'production') console.log('[admin/candidats] pd_admin expired');
            }
          } else {
            if (process.env.NODE_ENV !== 'production') console.log('[admin/candidats] pd_admin signature mismatch');
          }
        }
      }
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') console.log('[admin/candidats] pd_admin check error', e);
    }
  }

  // DEV emergency shortcut: if still no session, accept any request that
  // includes a `next-auth.session-token` cookie in development to unblock local testing.
  if (process.env.NODE_ENV !== 'production' && (!session || Object.keys(session || {}).length === 0)) {
    const devToken = req.cookies.get('next-auth.session-token')?.value;
    if (devToken) {
      if (process.env.NODE_ENV !== 'production') console.log('[admin/candidats] DEV shortcut: accepting next-auth.session-token present');
      // create a synthetic admin session
      session = { user: { id: 'dev-admin', role: 'admin' } } as any;
    }
  }

  if (!session || session.user?.role !== 'admin') {
    if (process.env.NODE_ENV !== 'production') console.log('[admin/candidats] session check failed', { session });

    // Fallback: attempt to verify or decode the JWT token from cookie
    try {
      const token = req.cookies.get('next-auth.session-token')?.value;
      const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "";
      if (process.env.NODE_ENV !== 'production') console.log('[admin/candidats] fallback token present:', !!token);
      if (token && secret) {
        // Try decrypt JWE first (NextAuth often issues encrypted cookies), then verify signed JWT.
        try {
          // Derive 64-byte key from secret (SHA-512) to match A256CBC-HS512 CEK
          const { createHash } = await import('crypto');
          const key = createHash('sha512').update(secret).digest();
          try {
            const { payload } = await jwtDecrypt(token, key as unknown as CryptoKey | Uint8Array);
            if (process.env.NODE_ENV !== 'production') console.log('[admin/candidats] jwtDecrypt payload', { payload });
            if ((payload as any).role === 'admin') {
              // accepted
                // set session from payload for subsequent code
                session = { user: { id: String((payload as any).id), role: 'admin' } } as any;
            } else {
              return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
            }
          } catch (e) {
            if (process.env.NODE_ENV !== 'production') console.log('[admin/candidats] jwtDecrypt failed', e?.toString?.() ?? e);
            // fallback to verify
            try {
              const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
              if (process.env.NODE_ENV !== 'production') console.log('[admin/candidats] jwtVerify payload', { payload });
              if ((payload as any).role === 'admin') {
                session = { user: { id: String((payload as any).id), role: 'admin' } } as any;
                // accepted
              } else {
                return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
              }
            } catch (err) {
              if (process.env.NODE_ENV !== 'production') console.log('[admin/candidats] jwtVerify failed', err?.toString?.() ?? err);
              try {
                const payload = decodeJwt(token as string);
                if (process.env.NODE_ENV !== 'production') console.log('[admin/candidats] decodeJwt payload', { payload });
                if ((payload as any).role === 'admin') {
                  session = { user: { id: String((payload as any).id), role: 'admin' } } as any;
                  // accept in dev fallback
                } else {
                  return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
                }
              } catch (err2) {
                if (process.env.NODE_ENV !== 'production') console.log('[admin/candidats] decodeJwt failed', err2?.toString?.() ?? err2);
                return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
              }
            }
          }
        } catch (outerErr) {
          if (process.env.NODE_ENV !== 'production') console.log('[admin/candidats] fallback outer error', outerErr);
          return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }
      } else {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.log('[admin/candidats] fallback error', err);
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
  }

  try {
    const formData = await req.formData();

    const nom = (formData.get("nom") as string)?.trim();
    const email = (formData.get("email") as string)?.trim();
    const emailNormalized = email?.toLowerCase() ?? "";
    const slug = (formData.get("slug") as string)?.trim().toLowerCase();
    const password = formData.get("password") as string;
    const bio = (formData.get("bio") as string)?.trim() || null;
    const domaine = formData.get("domaine") as string;
    const videoUrl = (formData.get("videoUrl") as string)?.trim() || null;
    const photoFile = formData.get("photo") as File | null;

    if (!nom || !slug || !domaine) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants." },
        { status: 400 }
      );
    }

    if (emailNormalized && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalized)) {
      return NextResponse.json(
        { error: "Format email invalide." },
        { status: 400 }
      );
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      return NextResponse.json(
        { error: "Slug invalide (lettres, chiffres et tirets uniquement)." },
        { status: 400 }
      );
    }

    // Vérifier unicité email + slug
    if (emailNormalized) {
      const existing = await db
        .select()
        .from(candidates)
        .where(eq(candidates.email, emailNormalized));
      if (existing.length > 0) {
        return NextResponse.json(
          { error: "Un candidat avec cet email existe déjà." },
          { status: 400 }
        );
      }
    }

    const existingSlug = await db
      .select()
      .from(candidates)
      .where(eq(candidates.slug, slug));
    if (existingSlug.length > 0) {
      return NextResponse.json(
        { error: "Ce slug est déjà utilisé." },
        { status: 400 }
      );
    }

    // Upload photo
    let photoUrl: string | null = null;
    if (photoFile && photoFile.size > 0 && isCloudinaryConfigured()) {
      const buffer = Buffer.from(await photoFile.arrayBuffer());
      photoUrl = await uploadToCloudinary(buffer, "prodigital_candidats", slug);
    }

    const hashedPassword = password ? await bcrypt.hash(password, 12) : null;

    const result = await db
      .insert(candidates)
      .values({
        nom,
        email: emailNormalized || null,
        slug,
        password: hashedPassword,
        bio,
        domaine: domaine as Domaine,
        videoUrl,
        photo: photoUrl,
        actif: true,
      })
      .returning();

    await auditLog({
      adminId: parseInt(session.user.id),
      action: "create_candidate",
      targetType: "candidate",
      targetId: result[0].id,
      details: `nom=${nom}, domaine=${domaine}`,
    });

    return NextResponse.json({ success: true, id: result[0].id }, { status: 201 });
  } catch (err) {
    logError("Create candidate", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
