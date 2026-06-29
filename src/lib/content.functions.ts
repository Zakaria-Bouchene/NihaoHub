import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase configuration");
  }
  return createClient<Database>(
    url,
    key,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

// ── Legacy Chinese-specific queries (kept for backward compat) ───────────────

export const listWords = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data, error } = await sb
    .from("words")
    .select("id, chinese, pinyin, english, hsk_level")
    .eq("is_public", true)
    .order("created_at", { ascending: true })
    .limit(500);
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const listSentences = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data, error } = await sb
    .from("sentences")
    .select("id, chinese, pinyin, english")
    .eq("is_public", true)
    .order("created_at", { ascending: true })
    .limit(500);
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const listTexts = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data, error } = await sb
    .from("texts")
    .select("id, title, created_at")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getText = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: row, error } = await sb
      .from("texts")
      .select("id, title, content, pinyin, translation")
      .eq("id", data.id)
      .eq("is_public", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Not found");
    return row;
  });

// ── Multilanguage card queries ───────────────────────────────────────────────

export const listCards = createServerFn({ method: "GET" })
  .inputValidator((d: { sourceLang: string; targetLang: string }) => d)
  .handler(async ({ data }) => {
    const sb = publicClient();
    const filter = `and(source_lang.eq.${data.sourceLang},target_lang.eq.${data.targetLang}),and(source_lang.eq.${data.targetLang},target_lang.eq.${data.sourceLang})`;
    const { data: rows, error } = await sb
      .from("cards")
      .select("id, source_lang, target_lang, source_text, transliteration, target_text")
      .or(filter)
      .eq("is_public", true)
      .order("created_at", { ascending: true })
      .limit(500);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const listPassages = createServerFn({ method: "GET" })
  .inputValidator((d: { sourceLang: string; targetLang: string }) => d)
  .handler(async ({ data }) => {
    const sb = publicClient();
    const filter = `and(source_lang.eq.${data.sourceLang},target_lang.eq.${data.targetLang}),and(source_lang.eq.${data.targetLang},target_lang.eq.${data.sourceLang})`;
    const { data: rows, error } = await sb
      .from("reading_passages")
      .select("id, source_lang, target_lang, title, created_at")
      .or(filter)
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getPassage = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: row, error } = await sb
      .from("reading_passages")
      .select("id, source_lang, target_lang, title, source_content, transliteration, target_content")
      .eq("id", data.id)
      .eq("is_public", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Not found");
    return row;
  });