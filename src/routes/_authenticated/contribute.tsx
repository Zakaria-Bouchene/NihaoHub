import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createWord, createSentence, createText, createCard, createPassage } from "@/lib/authed.functions";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LANGUAGES, getLanguage, getStoredPair } from "@/lib/languages";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/contribute")({
  component: ContributePage,
});

function ContributePage() {
  const stored = getStoredPair();
  const [sourceLang, setSourceLang] = useState(stored.sourceLang);
  const [targetLang, setTargetLang] = useState(stored.targetLang);

  const isChinesePair = sourceLang === "en" && targetLang === "zh";
  const sourceLangObj = getLanguage(sourceLang);
  const targetLangObj = getLanguage(targetLang);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-serif-display text-3xl font-semibold">Contribute content</h1>
      <p className="mt-1 text-muted-foreground">Add to the public library so other learners benefit.</p>

      {/* ── Language pair selector ── */}
      <div className="mt-5 rounded-xl border border-border bg-card p-4">
        <p className="mb-3 text-sm font-medium text-muted-foreground">Contributing to</p>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Source language</label>
            <Select value={sourceLang} onValueChange={v => { setSourceLang(v); if (v === targetLang) setTargetLang(LANGUAGES.find(l => l.code !== v)?.code ?? "es"); }}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {LANGUAGES.filter(l => l.code !== targetLang).map(l => (
                  <SelectItem key={l.code} value={l.code}>{l.flag} {l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <ArrowRight className="mt-5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Target language</label>
            <Select value={targetLang} onValueChange={v => { setTargetLang(v); if (v === sourceLang) setSourceLang(LANGUAGES.find(l => l.code !== v)?.code ?? "en"); }}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {LANGUAGES.filter(l => l.code !== sourceLang).map(l => (
                  <SelectItem key={l.code} value={l.code}>{l.flag} {l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Tabs defaultValue="card" className="mt-6">
        <TabsList>
          <TabsTrigger value="card">Card</TabsTrigger>
          <TabsTrigger value="passage">Reading passage</TabsTrigger>
          {isChinesePair && <TabsTrigger value="word">Word (Chinese)</TabsTrigger>}
          {isChinesePair && <TabsTrigger value="sentence">Sentence (Chinese)</TabsTrigger>}
          {isChinesePair && <TabsTrigger value="text">Reading text (Chinese)</TabsTrigger>}
        </TabsList>

        <TabsContent value="card">
          <CardForm
            sourceLang={sourceLang}
            targetLang={targetLang}
            sourceLangObj={sourceLangObj}
            targetLangObj={targetLangObj}
          />
        </TabsContent>

        <TabsContent value="passage">
          <PassageForm
            sourceLang={sourceLang}
            targetLang={targetLang}
            sourceLangObj={sourceLangObj}
            targetLangObj={targetLangObj}
          />
        </TabsContent>

        {isChinesePair && (
          <TabsContent value="word"><WordForm /></TabsContent>
        )}
        {isChinesePair && (
          <TabsContent value="sentence"><SentenceForm /></TabsContent>
        )}
        {isChinesePair && (
          <TabsContent value="text"><TextForm /></TabsContent>
        )}
      </Tabs>
    </div>
  );
}

// ── Multilang Card Form ──────────────────────────────────────────────────────

function CardForm({
  sourceLang, targetLang, sourceLangObj, targetLangObj,
}: {
  sourceLang: string; targetLang: string;
  sourceLangObj: ReturnType<typeof getLanguage>;
  targetLangObj: ReturnType<typeof getLanguage>;
}) {
  const qc = useQueryClient();
  const fn = useServerFn(createCard);
  const [v, setV] = useState({ sourceText: "", transliteration: "", targetText: "", notes: "" });
  const showTranslit = targetLangObj?.hasTransliteration ?? false;
  const translitLabel = targetLangObj?.transliterationLabel ?? "Romanisation";

  const m = useMutation({
    mutationFn: () => fn({
      data: {
        sourceLang, targetLang,
        sourceText: v.sourceText,
        transliteration: showTranslit && v.transliteration ? v.transliteration : undefined,
        targetText: v.targetText,
        notes: v.notes || undefined,
      },
    }),
    onSuccess: () => {
      toast.success("Card added");
      setV({ sourceText: "", transliteration: "", targetText: "", notes: "" });
      qc.invalidateQueries({ queryKey: ["deck"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <form className="space-y-4 pt-4" onSubmit={e => { e.preventDefault(); m.mutate(); }}>
      <Field label={`${sourceLangObj?.flag ?? ""} ${sourceLangObj?.name ?? "Source"} (what you know)`}>
        <Input
          value={v.sourceText}
          onChange={e => setV({ ...v, sourceText: e.target.value })}
          required
          maxLength={512}
          placeholder={`e.g. "hello"`}
        />
      </Field>
      {showTranslit && (
        <Field label={`${translitLabel} (optional)`}>
          <Input
            value={v.transliteration}
            onChange={e => setV({ ...v, transliteration: e.target.value })}
            maxLength={1024}
            placeholder={`e.g. ${targetLangObj?.code === "zh" ? "nǐ hǎo" : targetLangObj?.code === "ja" ? "Konnichiwa" : "phonetic spelling"}`}
          />
        </Field>
      )}
      <Field label={`${targetLangObj?.flag ?? ""} ${targetLangObj?.name ?? "Target"} (what you're learning)`}>
        <Input
          value={v.targetText}
          onChange={e => setV({ ...v, targetText: e.target.value })}
          required
          maxLength={512}
          dir={targetLangObj?.rtl ? "rtl" : undefined}
          placeholder={`Translation in ${targetLangObj?.name ?? "target language"}`}
        />
      </Field>
      <Field label="Notes (optional)">
        <Input
          value={v.notes}
          onChange={e => setV({ ...v, notes: e.target.value })}
          maxLength={1000}
          placeholder="Usage notes, context, examples…"
        />
      </Field>
      <Button type="submit" disabled={m.isPending}>Add card</Button>
    </form>
  );
}

// ── Multilang Passage Form ───────────────────────────────────────────────────

function PassageForm({
  sourceLang, targetLang, sourceLangObj, targetLangObj,
}: {
  sourceLang: string; targetLang: string;
  sourceLangObj: ReturnType<typeof getLanguage>;
  targetLangObj: ReturnType<typeof getLanguage>;
}) {
  const qc = useQueryClient();
  const fn = useServerFn(createPassage);
  const [v, setV] = useState({ title: "", sourceContent: "", transliteration: "", targetContent: "" });
  const showTranslit = targetLangObj?.hasTransliteration ?? false;
  const translitLabel = targetLangObj?.transliterationLabel ?? "Romanisation";

  const m = useMutation({
    mutationFn: () => fn({
      data: {
        sourceLang, targetLang,
        title: v.title,
        sourceContent: v.sourceContent,
        transliteration: showTranslit && v.transliteration ? v.transliteration : undefined,
        targetContent: v.targetContent,
      },
    }),
    onSuccess: () => {
      toast.success("Reading passage added");
      setV({ title: "", sourceContent: "", transliteration: "", targetContent: "" });
      qc.invalidateQueries({ queryKey: ["passages"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <form className="space-y-4 pt-4" onSubmit={e => { e.preventDefault(); m.mutate(); }}>
      <Field label="Title">
        <Input value={v.title} onChange={e => setV({ ...v, title: e.target.value })} required maxLength={200} />
      </Field>
      <Field label={`${targetLangObj?.flag ?? ""} Content (in ${targetLangObj?.name ?? "target language"})`}>
        <Textarea
          value={v.sourceContent}
          onChange={e => setV({ ...v, sourceContent: e.target.value })}
          required maxLength={8000} rows={5}
          dir={targetLangObj?.rtl ? "rtl" : undefined}
        />
      </Field>
      {showTranslit && (
        <Field label={`${translitLabel} (optional, matching paragraphs)`}>
          <Textarea
            value={v.transliteration}
            onChange={e => setV({ ...v, transliteration: e.target.value })}
            maxLength={16000} rows={3}
          />
        </Field>
      )}
      <Field label={`${sourceLangObj?.flag ?? ""} Translation (in ${sourceLangObj?.name ?? "source language"})`}>
        <Textarea value={v.targetContent} onChange={e => setV({ ...v, targetContent: e.target.value })} required maxLength={8000} rows={4} />
      </Field>
      <Button type="submit" disabled={m.isPending}>Add passage</Button>
    </form>
  );
}

// ── Legacy Chinese Forms (kept for backward compat) ──────────────────────────

function WordForm() {
  const qc = useQueryClient();
  const fn = useServerFn(createWord);
  const [v, setV] = useState({ chinese: "", pinyin: "", english: "" });
  const m = useMutation({
    mutationFn: () => fn({ data: v }),
    onSuccess: () => { toast.success("Word added"); setV({ chinese: "", pinyin: "", english: "" }); qc.invalidateQueries({ queryKey: ["words"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <form className="space-y-4 pt-4" onSubmit={e => { e.preventDefault(); m.mutate(); }}>
      <Field label="Chinese (汉字)"><Input className="font-hanzi text-lg" value={v.chinese} onChange={e => setV({ ...v, chinese: e.target.value })} required maxLength={64} /></Field>
      <Field label="Pinyin"><Input value={v.pinyin} onChange={e => setV({ ...v, pinyin: e.target.value })} required maxLength={128} placeholder="e.g. nǐ hǎo" /></Field>
      <Field label="English"><Input value={v.english} onChange={e => setV({ ...v, english: e.target.value })} required maxLength={256} /></Field>
      <Button type="submit" disabled={m.isPending}>Add word</Button>
    </form>
  );
}

function SentenceForm() {
  const qc = useQueryClient();
  const fn = useServerFn(createSentence);
  const [v, setV] = useState({ chinese: "", pinyin: "", english: "" });
  const m = useMutation({
    mutationFn: () => fn({ data: v }),
    onSuccess: () => { toast.success("Sentence added"); setV({ chinese: "", pinyin: "", english: "" }); qc.invalidateQueries({ queryKey: ["sentences"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <form className="space-y-4 pt-4" onSubmit={e => { e.preventDefault(); m.mutate(); }}>
      <Field label="Chinese"><Textarea className="font-hanzi text-lg" value={v.chinese} onChange={e => setV({ ...v, chinese: e.target.value })} required maxLength={512} rows={2} /></Field>
      <Field label="Pinyin"><Textarea value={v.pinyin} onChange={e => setV({ ...v, pinyin: e.target.value })} required maxLength={1024} rows={2} /></Field>
      <Field label="English"><Textarea value={v.english} onChange={e => setV({ ...v, english: e.target.value })} required maxLength={1024} rows={2} /></Field>
      <Button type="submit" disabled={m.isPending}>Add sentence</Button>
    </form>
  );
}

function TextForm() {
  const qc = useQueryClient();
  const fn = useServerFn(createText);
  const [v, setV] = useState({ title: "", content: "", pinyin: "", translation: "" });
  const m = useMutation({
    mutationFn: () => fn({ data: { ...v, pinyin: v.pinyin || undefined } }),
    onSuccess: () => { toast.success("Reading text added"); setV({ title: "", content: "", pinyin: "", translation: "" }); qc.invalidateQueries({ queryKey: ["texts"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <form className="space-y-4 pt-4" onSubmit={e => { e.preventDefault(); m.mutate(); }}>
      <Field label="Title"><Input value={v.title} onChange={e => setV({ ...v, title: e.target.value })} required maxLength={200} /></Field>
      <Field label="Chinese content (paragraphs separated by blank line)">
        <Textarea className="font-hanzi text-lg" value={v.content} onChange={e => setV({ ...v, content: e.target.value })} required maxLength={8000} rows={6} />
      </Field>
      <Field label="Pinyin (optional, matching paragraphs)">
        <Textarea value={v.pinyin} onChange={e => setV({ ...v, pinyin: e.target.value })} maxLength={16000} rows={4} />
      </Field>
      <Field label="English translation"><Textarea value={v.translation} onChange={e => setV({ ...v, translation: e.target.value })} required maxLength={8000} rows={4} /></Field>
      <Button type="submit" disabled={m.isPending}>Add text</Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}