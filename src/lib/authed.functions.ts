import { createServerFn } from "@tanstack/react-start";
import { requireFirebaseAuth } from "@/lib/firebase-auth";
import { z } from "zod";

const itemKind = z.enum(["word", "sentence", "text", "card", "passage"]);
const rating = z.enum(["again", "hard", "good", "easy"]);
const flag = z.enum(["difficult", "favorite"]);

/* ---------- Reviews ---------- */

export const recordReview = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((d: { itemKind: "word" | "sentence" | "text"; itemId: string; rating: "again"|"hard"|"good"|"easy"; reverse?: boolean }) =>
    z.object({ itemKind, itemId: z.string().uuid(), rating, reverse: z.boolean().optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("reviews").insert({
      user_id: context.userId,
      item_kind: data.itemKind,
      item_id: data.itemId,
      rating: data.rating,
      reverse_mode: data.reverse ?? false,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getStats = createServerFn({ method: "GET" })
  .middleware([requireFirebaseAuth])
  .handler(async ({ context }) => {
    const { data: reviews, error } = await context.supabase
      .from("reviews")
      .select("rating, reviewed_at, item_kind")
      .eq("user_id", context.userId)
      .order("reviewed_at", { ascending: false })
      .limit(1000);
    if (error) throw new Error(error.message);
    const total = reviews?.length ?? 0;
    const byRating: Record<string, number> = { again: 0, hard: 0, good: 0, easy: 0 };
    const daysMap = new Map<string, number>();
    for (const r of reviews ?? []) {
      byRating[r.rating] = (byRating[r.rating] ?? 0) + 1;
      const day = (r.reviewed_at as string).slice(0, 10);
      daysMap.set(day, (daysMap.get(day) ?? 0) + 1);
    }
    const last14 = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      const key = d.toISOString().slice(0, 10);
      return { day: key.slice(5), count: daysMap.get(key) ?? 0 };
    });
    return { total, byRating, last14 };
  });

/* ---------- Flags (difficult / favorite) ---------- */

export const toggleFlag = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((d: { itemKind: "word"|"sentence"|"text"; itemId: string; flag: "difficult"|"favorite" }) =>
    z.object({ itemKind, itemId: z.string().uuid(), flag }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const existing = await context.supabase
      .from("user_flags")
      .select("id")
      .eq("user_id", context.userId)
      .eq("item_kind", data.itemKind)
      .eq("item_id", data.itemId)
      .eq("flag", data.flag)
      .maybeSingle();
    if (existing.data) {
      await context.supabase.from("user_flags").delete().eq("id", existing.data.id);
      return { active: false };
    }
    const { error } = await context.supabase.from("user_flags").insert({
      user_id: context.userId, item_kind: data.itemKind, item_id: data.itemId, flag: data.flag,
    });
    if (error) throw new Error(error.message);
    return { active: true };
  });

export const listMyFlags = createServerFn({ method: "GET" })
  .middleware([requireFirebaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_flags")
      .select("item_kind, item_id, flag")
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/* ---------- Collections ---------- */

export const listCollections = createServerFn({ method: "GET" })
  .middleware([requireFirebaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("collections")
      .select("id, name, description, is_public, cloned_from, created_at, owner_id")
      .or(`is_public.eq.true,owner_id.eq.${context.userId}`)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createCollection = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((d: { name: string; description?: string; isPublic?: boolean }) =>
    z.object({ name: z.string().trim().min(1).max(120), description: z.string().max(1000).optional(), isPublic: z.boolean().optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("collections")
      .insert({ owner_id: context.userId, name: data.name, description: data.description ?? null, is_public: data.isPublic ?? false })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const getCollection = createServerFn({ method: "GET" })
  .middleware([requireFirebaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: col, error } = await context.supabase
      .from("collections").select("*").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!col) throw new Error("Not found");
    const { data: items } = await context.supabase
      .from("collection_items")
      .select("id, item_kind, item_id, position")
      .eq("collection_id", data.id)
      .order("position");

    // resolve items
    const wordIds = items?.filter(i => i.item_kind === "word").map(i => i.item_id) ?? [];
    const sentIds = items?.filter(i => i.item_kind === "sentence").map(i => i.item_id) ?? [];
    const textIds = items?.filter(i => i.item_kind === "text").map(i => i.item_id) ?? [];
    const [words, sentences, texts] = await Promise.all([
      wordIds.length ? context.supabase.from("words").select("id, chinese, pinyin, english").in("id", wordIds) : Promise.resolve({ data: [] as any[] }),
      sentIds.length ? context.supabase.from("sentences").select("id, chinese, pinyin, english").in("id", sentIds) : Promise.resolve({ data: [] as any[] }),
      textIds.length ? context.supabase.from("texts").select("id, title").in("id", textIds) : Promise.resolve({ data: [] as any[] }),
    ]);
    const wMap = new Map((words.data ?? []).map((w: any) => [w.id, w]));
    const sMap = new Map((sentences.data ?? []).map((s: any) => [s.id, s]));
    const tMap = new Map((texts.data ?? []).map((t: any) => [t.id, t]));
    const resolved = (items ?? []).map(i => ({
      ...i,
      data: i.item_kind === "word" ? wMap.get(i.item_id) : i.item_kind === "sentence" ? sMap.get(i.item_id) : tMap.get(i.item_id),
    }));
    return { collection: col, items: resolved };
  });

export const addToCollection = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((d: { collectionId: string; itemKind: "word"|"sentence"|"text"; itemId: string }) =>
    z.object({ collectionId: z.string().uuid(), itemKind, itemId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { count } = await context.supabase
      .from("collection_items")
      .select("id", { count: "exact", head: true })
      .eq("collection_id", data.collectionId);
    const { error } = await context.supabase.from("collection_items").insert({
      collection_id: data.collectionId, item_kind: data.itemKind, item_id: data.itemId, position: count ?? 0,
    });
    if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    return { ok: true };
  });

export const removeFromCollection = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((d: { itemRowId: string }) => z.object({ itemRowId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("collection_items").delete().eq("id", data.itemRowId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const cloneCollection = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: src, error: e1 } = await context.supabase
      .from("collections").select("name, description").eq("id", data.id).maybeSingle();
    if (e1 || !src) throw new Error("Source not found");
    const { data: newCol, error: e2 } = await context.supabase
      .from("collections")
      .insert({ owner_id: context.userId, name: `${src.name} (copy)`, description: src.description, cloned_from: data.id, is_public: false })
      .select("id").single();
    if (e2) throw new Error(e2.message);
    const { data: items } = await context.supabase
      .from("collection_items").select("item_kind, item_id, position").eq("collection_id", data.id);
    if (items?.length) {
      await context.supabase.from("collection_items").insert(
        items.map(i => ({ collection_id: newCol.id, item_kind: i.item_kind, item_id: i.item_id, position: i.position })),
      );
    }
    return newCol;
  });

export const deleteCollection = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("collections").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------- Smart collections ---------- */

export const getSmartCollection = createServerFn({ method: "GET" })
  .middleware([requireFirebaseAuth])
  .inputValidator((d: { kind: "difficult"|"favorite"|"struggling" }) =>
    z.object({ kind: z.enum(["difficult", "favorite", "struggling"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    let itemRefs: Array<{ kind: string; id: string }> = [];
    if (data.kind === "struggling") {
      // items rated again/hard in last 30 days
      const since = new Date(Date.now() - 30 * 86400000).toISOString();
      const { data: rs } = await context.supabase
        .from("reviews")
        .select("item_kind, item_id, rating")
        .eq("user_id", context.userId)
        .gte("reviewed_at", since)
        .in("rating", ["again", "hard"]);
      const seen = new Set<string>();
      for (const r of rs ?? []) {
        const key = `${r.item_kind}:${r.item_id}`;
        if (!seen.has(key)) { seen.add(key); itemRefs.push({ kind: r.item_kind, id: r.item_id }); }
      }
    } else {
      const { data: fl } = await context.supabase
        .from("user_flags").select("item_kind, item_id")
        .eq("user_id", context.userId)
        .eq("flag", data.kind);
      itemRefs = (fl ?? []).map(f => ({ kind: f.item_kind, id: f.item_id }));
    }
    const words = itemRefs.filter(r => r.kind === "word").map(r => r.id);
    const sents = itemRefs.filter(r => r.kind === "sentence").map(r => r.id);
    const cards = itemRefs.filter(r => r.kind === "card").map(r => r.id);
    
    const [w, s, c] = await Promise.all([
      words.length ? context.supabase.from("words").select("id, chinese, pinyin, english").in("id", words) : Promise.resolve({ data: [] as any[] }),
      sents.length ? context.supabase.from("sentences").select("id, chinese, pinyin, english").in("id", sents) : Promise.resolve({ data: [] as any[] }),
      cards.length ? context.supabase.from("cards").select("id, source_lang, target_lang, source_text, transliteration, target_text").in("id", cards) : Promise.resolve({ data: [] as any[] }),
    ]);
    return {
      items: [
        ...((w.data ?? []).map((x: any) => ({ item_kind: "word" as const, item_id: x.id, data: x }))),
        ...((s.data ?? []).map((x: any) => ({ item_kind: "sentence" as const, item_id: x.id, data: x }))),
        ...((c.data ?? []).map((x: any) => ({ item_kind: "card" as const, item_id: x.id, data: x }))),
      ],
    };
  });

/* ---------- Contribute ---------- */

export const createWord = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((d: { chinese: string; pinyin: string; english: string; hskLevel?: number; isPublic?: boolean }) =>
    z.object({
      chinese: z.string().trim().min(1).max(64),
      pinyin: z.string().trim().min(1).max(128),
      english: z.string().trim().min(1).max(256),
      hskLevel: z.number().int().min(1).max(9).optional(),
      isPublic: z.boolean().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("words").insert({
      chinese: data.chinese, pinyin: data.pinyin, english: data.english,
      hsk_level: data.hskLevel ?? null, created_by: context.userId, is_public: data.isPublic ?? true,
    }).select("id").single();
    if (error) throw new Error(error.message);
    return row;
  });

export const createSentence = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((d: { chinese: string; pinyin: string; english: string; isPublic?: boolean }) =>
    z.object({
      chinese: z.string().trim().min(1).max(512),
      pinyin: z.string().trim().min(1).max(1024),
      english: z.string().trim().min(1).max(1024),
      isPublic: z.boolean().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("sentences").insert({
      chinese: data.chinese, pinyin: data.pinyin, english: data.english,
      created_by: context.userId, is_public: data.isPublic ?? true,
    }).select("id").single();
    if (error) throw new Error(error.message);
    return row;
  });

export const createText = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((d: { title: string; content: string; pinyin?: string; translation: string; isPublic?: boolean }) =>
    z.object({
      title: z.string().trim().min(1).max(200),
      content: z.string().trim().min(1).max(8000),
      pinyin: z.string().max(16000).optional(),
      translation: z.string().trim().min(1).max(8000),
      isPublic: z.boolean().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("texts").insert({
      title: data.title, content: data.content, pinyin: data.pinyin ?? null,
      translation: data.translation, created_by: context.userId, is_public: data.isPublic ?? true,
    }).select("id").single();
    if (error) throw new Error(error.message);
    return row;
  });

/* ---------- Multilanguage cards & passages ---------- */

export const createCard = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((d: {
    sourceLang: string; targetLang: string;
    sourceText: string; transliteration?: string; targetText: string;
    notes?: string; isPublic?: boolean;
  }) =>
    z.object({
      sourceLang: z.string().length(2),
      targetLang: z.string().length(2),
      sourceText: z.string().trim().min(1).max(512),
      transliteration: z.string().max(1024).optional(),
      targetText: z.string().trim().min(1).max(512),
      notes: z.string().max(1000).optional(),
      isPublic: z.boolean().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("cards").insert({
      source_lang: data.sourceLang,
      target_lang: data.targetLang,
      source_text: data.sourceText,
      transliteration: data.transliteration ?? null,
      target_text: data.targetText,
      notes: data.notes ?? null,
      created_by: context.userId,
      is_public: data.isPublic ?? true,
    }).select("id").single();
    if (error) throw new Error(error.message);
    return row;
  });

export const createPassage = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((d: {
    sourceLang: string; targetLang: string;
    title: string; sourceContent: string;
    transliteration?: string; targetContent: string;
    isPublic?: boolean;
  }) =>
    z.object({
      sourceLang: z.string().length(2),
      targetLang: z.string().length(2),
      title: z.string().trim().min(1).max(200),
      sourceContent: z.string().trim().min(1).max(8000),
      transliteration: z.string().max(16000).optional(),
      targetContent: z.string().trim().min(1).max(8000),
      isPublic: z.boolean().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("reading_passages").insert({
      source_lang: data.sourceLang,
      target_lang: data.targetLang,
      title: data.title,
      source_content: data.sourceContent,
      transliteration: data.transliteration ?? null,
      target_content: data.targetContent,
      created_by: context.userId,
      is_public: data.isPublic ?? true,
    }).select("id").single();
    if (error) throw new Error(error.message);
    return row;
  });