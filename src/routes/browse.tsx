import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listWords, listSentences, listTexts, listCards, listPassages } from "@/lib/content.functions";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { LANGUAGES, getLanguage, getStoredPair } from "@/lib/languages";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/browse")({
  head: () => ({
    meta: [
      { title: "Browse — LangsHub" },
      { name: "description", content: "Browse community-contributed flashcards and reading passages in any language." },
    ],
  }),
  component: BrowsePage,
});

function BrowsePage() {
  const stored = getStoredPair();
  const [sourceLang, setSourceLang] = useState(stored.sourceLang);
  const [targetLang, setTargetLang] = useState(stored.targetLang);

  const isChinesePair = sourceLang === "en" && targetLang === "zh";
  const sourceLangObj = getLanguage(sourceLang);
  const targetLangObj = getLanguage(targetLang);

  // Multilang card queries
  const cardsFn = useServerFn(listCards);
  const passagesFn = useServerFn(listPassages);
  // Legacy Chinese queries
  const wordsFn = useServerFn(listWords);
  const sentsFn = useServerFn(listSentences);
  const textsFn = useServerFn(listTexts);

  const cardsQ = useQuery({
    queryKey: ["cards", sourceLang, targetLang],
    queryFn: () => cardsFn({ data: { sourceLang, targetLang } }),
    enabled: !isChinesePair,
  });
  const passagesQ = useQuery({
    queryKey: ["passages", sourceLang, targetLang],
    queryFn: () => passagesFn({ data: { sourceLang, targetLang } }),
    enabled: !isChinesePair,
  });
  const wordsQ = useQuery({ queryKey: ["words"], queryFn: () => wordsFn(), enabled: isChinesePair });
  const sentsQ = useQuery({ queryKey: ["sentences"], queryFn: () => sentsFn(), enabled: isChinesePair });
  const textsQ = useQuery({ queryKey: ["texts"], queryFn: () => textsFn(), enabled: isChinesePair });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-serif-display text-3xl font-semibold tracking-tight">Browse the library</h1>
      <p className="mt-1 text-muted-foreground">
        Public content contributed by the community. Sign in to study, mark favorites, and add your own.
      </p>

      {/* ── Language pair filter ── */}
      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
        <span className="text-sm font-medium text-muted-foreground">Showing:</span>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Source</label>
          <Select value={sourceLang} onValueChange={v => { setSourceLang(v); if (v === targetLang) setTargetLang(LANGUAGES.find(l => l.code !== v)?.code ?? "es"); }}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              {LANGUAGES.filter(l => l.code !== targetLang).map(l => (
                <SelectItem key={l.code} value={l.code}>{l.flag} {l.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <ArrowRight className="mt-5 h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Target</label>
          <Select value={targetLang} onValueChange={v => { setTargetLang(v); if (v === sourceLang) setSourceLang(LANGUAGES.find(l => l.code !== v)?.code ?? "en"); }}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              {LANGUAGES.filter(l => l.code !== sourceLang).map(l => (
                <SelectItem key={l.code} value={l.code}>{l.flag} {l.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto flex items-center gap-2 text-sm font-medium">
          <span>{sourceLangObj?.flag} {sourceLangObj?.name}</span>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <span className="text-primary">{targetLangObj?.flag} {targetLangObj?.name}</span>
        </div>
      </div>

      {/* ── Content tabs ── */}
      {isChinesePair ? (
        <Tabs defaultValue="words" className="mt-8">
          <TabsList>
            <TabsTrigger value="words">Words ({wordsQ.data?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="sentences">Sentences ({sentsQ.data?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="texts">Texts ({textsQ.data?.length ?? 0})</TabsTrigger>
          </TabsList>
          <TabsContent value="words">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(wordsQ.data ?? []).map(w => (
                <Card key={w.id} className="p-4">
                  <p className="hanzi-lg">{w.chinese}</p>
                  <p className="text-sm text-primary">{w.pinyin}</p>
                  <p className="text-sm text-muted-foreground">{w.english}</p>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="sentences">
            <div className="grid gap-3 md:grid-cols-2">
              {(sentsQ.data ?? []).map(s => (
                <Card key={s.id} className="p-4">
                  <p className="font-hanzi text-lg">{s.chinese}</p>
                  <p className="text-sm text-primary">{s.pinyin}</p>
                  <p className="text-sm text-muted-foreground">{s.english}</p>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="texts">
            <div className="grid gap-3 md:grid-cols-2">
              {(textsQ.data ?? []).map(t => (
                <Link key={t.id} to="/reading/$id" params={{ id: t.id }} className="block">
                  <Card className="p-4 transition-shadow hover:shadow-md">
                    <p className="font-serif-display text-lg font-semibold">{t.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Open lesson →</p>
                  </Card>
                </Link>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <Tabs defaultValue="cards" className="mt-8">
          <TabsList>
            <TabsTrigger value="cards">Cards ({cardsQ.data?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="passages">Passages ({passagesQ.data?.length ?? 0})</TabsTrigger>
          </TabsList>
          <TabsContent value="cards">
            {cardsQ.isLoading && <p className="py-8 text-center text-muted-foreground">Loading…</p>}
            {!cardsQ.isLoading && (cardsQ.data?.length ?? 0) === 0 && (
              <p className="py-8 text-center text-muted-foreground">
                No public cards yet for {sourceLangObj?.name} → {targetLangObj?.name}.
              </p>
            )}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(cardsQ.data ?? []).map(c => (
                <Card key={c.id} className="p-4">
                  <p className="text-base font-medium">{c.source_text}</p>
                  {c.transliteration && (
                    <p className="mt-1 text-sm text-primary">{c.transliteration}</p>
                  )}
                  <p
                    className="mt-1 text-sm text-muted-foreground"
                    dir={targetLangObj?.rtl ? "rtl" : undefined}
                  >
                    {c.target_text}
                  </p>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="passages">
            {passagesQ.isLoading && <p className="py-8 text-center text-muted-foreground">Loading…</p>}
            {!passagesQ.isLoading && (passagesQ.data?.length ?? 0) === 0 && (
              <p className="py-8 text-center text-muted-foreground">
                No passages yet for {sourceLangObj?.name} → {targetLangObj?.name}.
              </p>
            )}
            <div className="grid gap-3 md:grid-cols-2">
              {(passagesQ.data ?? []).map(p => (
                <Card key={p.id} className="p-4">
                  <p className="font-serif-display text-lg font-semibold">{p.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {sourceLangObj?.flag} {sourceLangObj?.name} → {targetLangObj?.flag} {targetLangObj?.name}
                  </p>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}