import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getCollection, removeFromCollection, addToCollection, cloneCollection } from "@/lib/authed.functions";
import { listWords, listSentences, listTexts } from "@/lib/content.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Copy, X, Download, BookOpen } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/collections/$id")({
  component: CollectionDetail,
});

function CollectionDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const getFn = useServerFn(getCollection);
  const removeFn = useServerFn(removeFromCollection);
  const addFn = useServerFn(addToCollection);
  const cloneFn = useServerFn(cloneCollection);

  const wordsFn = useServerFn(listWords);
  const sentsFn = useServerFn(listSentences);
  const textsFn = useServerFn(listTexts);

  const col = useQuery({ queryKey: ["collection", id], queryFn: () => getFn({ data: { id } }) });
  const words = useQuery({ queryKey: ["words"], queryFn: () => wordsFn() });
  const sents = useQuery({ queryKey: ["sentences"], queryFn: () => sentsFn() });
  const texts = useQuery({ queryKey: ["texts"], queryFn: () => textsFn() });

  const [search, setSearch] = useState("");

  const add = useMutation({
    mutationFn: (v: { kind: "word"|"sentence"|"text"; itemId: string }) =>
      addFn({ data: { collectionId: id, itemKind: v.kind, itemId: v.itemId } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["collection", id] }),
  });
  const remove = useMutation({
    mutationFn: (rowId: string) => removeFn({ data: { itemRowId: rowId } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["collection", id] }),
  });
  const clone = useMutation({
    mutationFn: () => cloneFn({ data: { id } }),
    onSuccess: (row) => { toast.success("Cloned"); qc.invalidateQueries({ queryKey: ["collections"] }); window.location.assign(`/collections/${row.id}`); },
  });

  function exportJSON() {
    if (!col.data) return;
    const payload = {
      name: col.data.collection.name,
      description: col.data.collection.description,
      items: col.data.items.map(i => ({ kind: i.item_kind, data: i.data })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${col.data.collection.name}.json`; a.click();
    URL.revokeObjectURL(url);
  }

  if (!col.data) return <div className="px-4 py-8 text-center text-muted-foreground">Loading…</div>;

  const { collection, items } = col.data;
  const existingIds = new Set(items.map(i => `${i.item_kind}:${i.item_id}`));
  const lower = search.toLowerCase();
  const filterWord = (w: any) => !existingIds.has(`word:${w.id}`) && (!lower || w.chinese.includes(search) || w.pinyin.toLowerCase().includes(lower) || w.english.toLowerCase().includes(lower));
  const filterSent = (s: any) => !existingIds.has(`sentence:${s.id}`) && (!lower || s.chinese.includes(search) || s.english.toLowerCase().includes(lower));
  const filterText = (t: any) => !existingIds.has(`text:${t.id}`) && (!lower || t.title.toLowerCase().includes(lower));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link to="/collections" className="text-sm text-muted-foreground hover:text-foreground">← All collections</Link>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif-display text-3xl font-semibold">{collection.name}</h1>
          {collection.description && <p className="mt-1 text-muted-foreground">{collection.description}</p>}
        </div>
        <div className="flex gap-2">
          <Button asChild><Link to="/study"><BookOpen className="mr-2 h-4 w-4" />Study</Link></Button>
          <Button variant="outline" onClick={() => clone.mutate()}><Copy className="mr-2 h-4 w-4" />Clone</Button>
          <Button variant="outline" onClick={exportJSON}><Download className="mr-2 h-4 w-4" />Export</Button>
        </div>
      </div>

      <h2 className="mt-8 font-serif-display text-xl font-semibold">In this collection ({items.length})</h2>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {items.map(i => i.data && (
          <Card key={i.id} className="flex items-start gap-3 p-3">
            <div className="flex-1">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">{i.item_kind}</p>
              <p className="font-hanzi text-lg">{(i.data as any).chinese ?? (i.data as any).title}</p>
              {(i.data as any).pinyin && <p className="text-sm text-primary">{(i.data as any).pinyin}</p>}
              {(i.data as any).english && <p className="text-sm text-muted-foreground">{(i.data as any).english}</p>}
            </div>
            <Button variant="ghost" size="icon" onClick={() => remove.mutate(i.id)}><X className="h-4 w-4" /></Button>
          </Card>
        ))}
        {items.length === 0 && <p className="col-span-full text-sm text-muted-foreground">Empty — add items below.</p>}
      </div>

      <h2 className="mt-10 font-serif-display text-xl font-semibold">Add content</h2>
      <Input className="mt-3 max-w-md" placeholder="Search library…" value={search} onChange={e => setSearch(e.target.value)} />
      <Tabs defaultValue="words" className="mt-4">
        <TabsList>
          <TabsTrigger value="words">Words</TabsTrigger>
          <TabsTrigger value="sentences">Sentences</TabsTrigger>
          <TabsTrigger value="texts">Texts</TabsTrigger>
        </TabsList>
        <TabsContent value="words" className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          {(words.data ?? []).filter(filterWord).slice(0, 60).map(w => (
            <Card key={w.id} className="flex items-center gap-2 p-3">
              <div className="flex-1">
                <p className="font-hanzi">{w.chinese} <span className="text-xs text-primary">{w.pinyin}</span></p>
                <p className="text-xs text-muted-foreground">{w.english}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => add.mutate({ kind: "word", itemId: w.id })}>Add</Button>
            </Card>
          ))}
        </TabsContent>
        <TabsContent value="sentences" className="grid gap-2 md:grid-cols-2">
          {(sents.data ?? []).filter(filterSent).slice(0, 40).map(s => (
            <Card key={s.id} className="flex items-center gap-2 p-3">
              <div className="flex-1">
                <p className="font-hanzi">{s.chinese}</p>
                <p className="text-xs text-muted-foreground">{s.english}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => add.mutate({ kind: "sentence", itemId: s.id })}>Add</Button>
            </Card>
          ))}
        </TabsContent>
        <TabsContent value="texts" className="grid gap-2 md:grid-cols-2">
          {(texts.data ?? []).filter(filterText).map(t => (
            <Card key={t.id} className="flex items-center gap-2 p-3">
              <p className="flex-1 font-serif-display">{t.title}</p>
              <Button size="sm" variant="ghost" onClick={() => add.mutate({ kind: "text", itemId: t.id })}>Add</Button>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}