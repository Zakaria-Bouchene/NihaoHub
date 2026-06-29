import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { auth } from "./firebase";
import { getFirebaseAdmin } from "./firebase-admin";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// ── Client-side middleware to attach token ──────────────────────────────────
export const attachFirebaseAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    // Check if we have a Firebase user and get their current token
    const user = auth.currentUser;
    let token = null;
    if (user) {
      token = await user.getIdToken();
    }
    return next({
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
);

// ── Server-side middleware to verify token and inject Supabase client ────────
export const requireFirebaseAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const request = getRequest();

    if (!request?.headers) {
      throw new Error("Unauthorized: No request headers available");
    }

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error("Unauthorized: No valid authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      throw new Error("Unauthorized: No token provided");
    }

    // Verify token with Firebase Admin
    const admin = getFirebaseAdmin();
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
    } catch (e: any) {
      throw new Error(`Unauthorized: Invalid token (${e.message})`);
    }

    // We must use the SERVICE_ROLE_KEY to bypass RLS since Firebase users don't exist in Supabase auth.users
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
      throw new Error("Server misconfiguration: Database credentials missing");
    }

    const supabase = createClient<Database>(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    return next({
      context: {
        supabase,
        userId: decodedToken.uid, // This is the Firebase UID (string)
      },
    });
  },
);
