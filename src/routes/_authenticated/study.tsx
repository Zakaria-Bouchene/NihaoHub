import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listWords, listSentences, listCards } from "@/lib/content.functions";
import { getCollection, getSmartCollection, listCollections } from "@/lib/authed.functions";
import { Flashcard, type StudyCard } from "@/components/Flashcard";
import { useStudy } from "@/lib/study-store";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { LANGUAGES, getStoredPair, setStoredPair, getLanguage } from "@/lib/languages";
import { ArrowRight, Settings2 } from "lucide-react";

import { z } from "zod";
import { toast } from "sonner";
import { Share2 } from "lucide-react";

type Source = string;

const studySearchSchema = z.object({
  deck: z.string().optional(),
  sl: z.string().optional(),
  tl: z.string().optional(),
  mode: z.enum(["normal", "reverse"]).optional(),
});

export const Route = createFileRoute("/_authenticated/study")({
  validateSearch: studySearchSchema,
  component: StudyPage,
});

function StudyPage() {
  const qc = useQueryClient();
  const navigate = useNavigate({ from: Route.fullPath });
  const search = Route.useSearch();
  const { index, setIndex, mode, setMode } = useStudy();
  const [showLangPicker, setShowLangPicker] = useState(false);

  const stored = getStoredPair();
  const source = search.deck || "all-cards";
  const sourceLang = search.sl || stored.sourceLang;
  const targetLang = search.tl || stored.targetLang;

  // Sync initial URL mode to store if present
  useEffect(() => {
    if (search.mode && search.mode !== mode) {
      setMode(search.mode as "normal" | "reverse");
    }
  }, [search.mode, mode, setMode]);

  function updateSearch(updates: { deck?: string; sl?: string; tl?: string; mode?: "normal" | "reverse" }) {
    navigate({
      search: (prev) => ({
        ...prev,
        deck: updates.deck !== undefined ? updates.deck : prev.deck,
        sl: updates.sl !== undefined ? updates.sl : prev.sl,
        tl: updates.tl !== undefined ? updates.tl : prev.tl,
        mode: updates.mode !== undefined ? updates.mode : prev.mode,
      }),
      replace: true,
    });
  }

  const wordsFn = useServerFn(listWords);
  const sentsFn = useServerFn(listSentences);
  const cardsFn = useServerFn(listCards);
  const colFn = useServerFn(getCollection);
  const smartFn = useServerFn(getSmartCollection);
  const listColFn = useServerFn(listCollections);

  const cols = useQuery({ queryKey: ["collections"], queryFn: () => listColFn() });

  const isChinesePair = targetLang === "zh";

  const deckQuery = useQuery<StudyCard[]>({
    queryKey: ["deck", source, sourceLang, targetLang],
    queryFn: async () => {
      if (source === "all-cards") {
        if (isChinesePair) {
          // Use legacy words table for Chinese
          const w = await wordsFn();
          return w.map(x => ({
            item_kind: "word" as const,
            item_id: x.id,
            data: { id: x.id, chinese: x.chinese, pinyin: x.pinyin, english: x.english },
          }));
        }
        const cards = await cardsFn({ data: { sourceLang, targetLang } });
        return cards.map(x => ({
          item_kind: "card" as const,
          item_id: x.id,
          data: {
            id: x.id,
            source_text: x.source_text,
            transliteration: x.transliteration,
            target_text: x.target_text,
            source_lang: x.source_lang,
            target_lang: x.target_lang,
          },
        }));
      }
      if (source === "all-sentences") {
        if (isChinesePair) {
          const s = await sentsFn();
          return s.map(x => ({ item_kind: "sentence" as const, item_id: x.id, data: x }));
        }
        return [];
      }
      if (source.startsWith("smart:")) {
        const kind = source.slice(6) as "difficult" | "favorite" | "struggling";
        const r = await smartFn({ data: { kind } });
        return r.items as StudyCard[];
      }
      if (source.startsWith("col:")) {
        const id = source.slice(4);
        const r = await colFn({ data: { id } });
        return r.items
          .filter(i => (i.item_kind === "word" || i.item_kind === "sentence" || i.item_kind === "card") && i.data)
          .map(i => ({ item_kind: i.item_kind as "word" | "sentence" | "card", item_id: i.item_id, data: i.data as any }));
      }
      return [];
    },
  });

  // Shuffle once per deck load
  const deck = useMemo(() => {
    if (!deckQuery.data) return [];
    return [...deckQuery.data].sort(() => Math.random() - 0.5);
  }, [deckQuery.data]);

  useEffect(() => { setIndex(0); }, [source, sourceLang, targetLang, setIndex]);

  const card = deck[index];
  const sourceLangObj = getLanguage(sourceLang);
  const targetLangObj = getLanguage(targetLang);

  function applyLangChange(sl: string, tl: string) {
    setStoredPair(sl, tl);
    updateSearch({ sl, tl });
    setShowLangPicker(false);
    qc.invalidateQueries({ queryKey: ["deck"] });
  }

  function handleShare() {
    // Construct absolute URL for sharing
    const url = new URL(window.location.href);
    url.searchParams.set("deck", source);
    url.searchParams.set("sl", sourceLang);
    url.searchParams.set("tl", targetLang);
    url.searchParams.set("mode", mode);
    navigator.clipboard.writeText(url.toString());
    toast.success("Study link copied to clipboard!");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* ── Language pair header ── */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => setShowLangPicker(v => !v)}
          className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm transition-colors hover:bg-muted"
        >
          <span>{sourceLangObj?.flag} {sourceLangObj?.name}</span>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <span className="font-medium text-primary">{targetLangObj?.flag} {targetLangObj?.name}</span>
          <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        
        <Button variant="outline" size="sm" onClick={handleShare}>
          <Share2 className="mr-2 h-4 w-4" /> Share Deck
        </Button>
      </div>

      {/* ── Inline language picker ── */}
      {showLangPicker && (
        <LangPicker
          sourceLang={sourceLang}
          targetLang={targetLang}
          onApply={applyLangChange}
          onCancel={() => setShowLangPicker(false)}
        />
      )}

      {/* ── Deck selector ── */}
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <Label>Deck</Label>
          <Select
            value={source}
            onValueChange={(v) => { updateSearch({ deck: v }); qc.invalidateQueries({ queryKey: ["deck"] }); }}
          >
            <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all-cards">All public cards</SelectItem>
              {isChinesePair && <SelectItem value="all-sentences">All public sentences</SelectItem>}
              <SelectItem value="smart:favorite">★ Favorites</SelectItem>
              <SelectItem value="smart:difficult">🔥 Difficult</SelectItem>
              <SelectItem value="smart:struggling">Struggling (auto)</SelectItem>
              {cols.data?.map(c => <SelectItem key={c.id} value={`col:${c.id}`}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="reverse"
            checked={mode === "reverse"}
            onCheckedChange={(v) => {
              const newMode = v ? "reverse" : "normal";
              setMode(newMode);
              updateSearch({ mode: newMode });
            }}
          />
          <Label htmlFor="reverse">Reverse mode</Label>
        </div>
        <div className="ml-auto text-sm text-muted-foreground">
          {deck.length > 0 ? `${Math.min(index + 1, deck.length)} / ${deck.length}` : ""}
        </div>
      </div>

      {deckQuery.isLoading && <p className="text-center text-muted-foreground">Loading deck…</p>}

      {!deckQuery.isLoading && deck.length === 0 && (
        <div className="paper rounded-2xl p-10 text-center">
          <p className="font-serif-display text-2xl">Nothing to study here yet</p>
          <p className="mt-2 text-muted-foreground">
            No public cards exist for{" "}
            <strong>{sourceLangObj?.name} → {targetLangObj?.name}</strong> yet.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Button asChild><Link to="/contribute">Contribute cards</Link></Button>
            <Button variant="outline" asChild><Link to="/browse">Browse library</Link></Button>
          </div>
        </div>
      )}

      {card && index < deck.length && (
        <Flashcard card={card} onNext={() => setIndex(index + 1)} reverse={mode === "reverse"} activeSourceLang={sourceLang} />
      )}

      {deck.length > 0 && index >= deck.length && (
        <div className="paper rounded-2xl p-10 text-center">
          <p className="font-serif-display text-3xl">Session complete! 🎉</p>
          <p className="mt-2 text-muted-foreground">You reviewed {deck.length} cards.</p>
          <Button className="mt-4" onClick={() => { setIndex(0); qc.invalidateQueries({ queryKey: ["deck"] }); }}>
            Study again
          </Button>
        </div>
      )}
    </div>
  );
}

function LangPicker({
  sourceLang, targetLang,
  onApply, onCancel,
}: {
  sourceLang: string; targetLang: string;
  onApply: (sl: string, tl: string) => void;
  onCancel: () => void;
}) {
  const [sl, setSl] = useState(sourceLang);
  const [tl, setTl] = useState(targetLang);

  return (
    <div className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <p className="mb-4 text-sm font-medium">Change language pair</p>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">I speak</label>
          <Select value={sl} onValueChange={v => { setSl(v); if (v === tl) setTl(LANGUAGES.find(l => l.code !== v)?.code ?? "es"); }}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {LANGUAGES.filter(l => l.code !== tl).map(l => (
                <SelectItem key={l.code} value={l.code}>{l.flag} {l.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <ArrowRight className="mt-5 h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">I'm learning</label>
          <Select value={tl} onValueChange={v => { setTl(v); if (v === sl) setSl(LANGUAGES.find(l => l.code !== v)?.code ?? "en"); }}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {LANGUAGES.filter(l => l.code !== sl).map(l => (
                <SelectItem key={l.code} value={l.code}>{l.flag} {l.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Button size="sm" onClick={() => onApply(sl, tl)}>Apply</Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}