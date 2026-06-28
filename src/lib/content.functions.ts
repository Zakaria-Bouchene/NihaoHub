import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

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