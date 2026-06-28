import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listWords, listSentences } from "@/lib/content.functions";
import { getCollection, getSmartCollection, listCollections } from "@/lib/authed.functions";
import { Flashcard, type StudyCard } from "@/components/Flashcard";
import { useStudy } from "@/lib/study-store";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

type Source = string; // "all-words" | "all-sentences" | `smart:${kind}` | `col:${id}`

export const Route = createFileRoute("/_authenticated/study")({
  component: StudyPage,
});

function StudyPage() {
  const qc = useQueryClient();
  const { index, setIndex, mode, setMode } = useStudy();
  const [source, setSource] = useState<Source>("all-words");

  const wordsFn = useServerFn(listWords);
  const sentsFn = useServerFn(listSentences);
  const colFn = useServerFn(getCollection);
  const smartFn = useServerFn(getSmartCollection);
  const listColFn = useServerFn(listCollections);

  const cols = useQuery({ queryKey: ["collections"], queryFn: () => listColFn() });

  const deckQuery = useQuery<StudyCard[]>({
    queryKey: ["deck", source],
    queryFn: async () => {
      if (source === "all-words") {
        const w = await wordsFn();
        return w.map(x => ({ item_kind: "word", item_id: x.id, data: { id: x.id, chinese: x.chinese, pinyin: x.pinyin, english: x.english } }));
      }
      if (source === "all-sentences") {
        const s = await sentsFn();
        return s.map(x => ({ item_kind: "sentence", item_id: x.id, data: x }));
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
          .filter(i => i.item_kind !== "text" && i.data)
          .map(i => ({ item_kind: i.item_kind as "word"|"sentence", item_id: i.item_id, data: i.data as any }));
      }
      return [];
    },
  });

  // Shuffle once per deck load
  const deck = useMemo(() => {
    if (!deckQuery.data) return [];
    return [...deckQuery.data].sort(() => Math.random() - 0.5);
  }, [deckQuery.data]);

  useEffect(() => { setIndex(0); }, [source, setIndex]);

  const card = deck[index];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <Label>Deck</Label>
          <Select value={source} onValueChange={(v) => { setSource(v); qc.invalidateQueries({ queryKey: ["deck"] }); }}>
            <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all-words">All public words</SelectItem>
              <SelectItem value="all-sentences">All public sentences</SelectItem>
              <SelectItem value="smart:favorite">★ Favorites</SelectItem>
              <SelectItem value="smart:difficult">🔥 Difficult</SelectItem>
              <SelectItem value="smart:struggling">Struggling (auto)</SelectItem>
              {cols.data?.map(c => <SelectItem key={c.id} value={`col:${c.id}`}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="reverse" checked={mode === "reverse"} onCheckedChange={(v) => setMode(v ? "reverse" : "normal")} />
          <Label htmlFor="reverse">Reverse mode (EN → 中文)</Label>
        </div>
        <div className="ml-auto text-sm text-muted-foreground">
          {deck.length > 0 ? `${Math.min(index + 1, deck.length)} / ${deck.length}` : ""}
        </div>
      </div>

      {deckQuery.isLoading && <p className="text-center text-muted-foreground">Loading deck…</p>}

      {!deckQuery.isLoading && deck.length === 0 && (
        <div className="paper rounded-2xl p-10 text-center">
          <p className="font-serif-display text-2xl">Nothing to study here yet</p>
          <p className="mt-2 text-muted-foreground">Add items to your collection or favorite some cards first.</p>
          <Button asChild className="mt-4"><Link to="/browse">Browse content</Link></Button>
        </div>
      )}

      {card && index < deck.length && (
        <Flashcard card={card} onNext={() => setIndex(index + 1)} reverse={mode === "reverse"} />
      )}

      {deck.length > 0 && index >= deck.length && (
        <div className="paper rounded-2xl p-10 text-center">
          <p className="font-serif-display text-3xl">完成! Session complete.</p>
          <p className="mt-2 text-muted-foreground">You reviewed {deck.length} cards.</p>
          <Button className="mt-4" onClick={() => { setIndex(0); qc.invalidateQueries({ queryKey: ["deck"] }); }}>Study again</Button>
        </div>
      )}
    </div>
  );
}