import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createWord, createSentence, createText } from "@/lib/authed.functions";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/contribute")({
  component: ContributePage,
});

function ContributePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-serif-display text-3xl font-semibold">Contribute content</h1>
      <p className="mt-1 text-muted-foreground">Add to the public library so other learners benefit.</p>
      <Tabs defaultValue="word" className="mt-6">
        <TabsList><TabsTrigger value="word">Word</TabsTrigger><TabsTrigger value="sentence">Sentence</TabsTrigger><TabsTrigger value="text">Reading text</TabsTrigger></TabsList>
        <TabsContent value="word"><WordForm /></TabsContent>
        <TabsContent value="sentence"><SentenceForm /></TabsContent>
        <TabsContent value="text"><TextForm /></TabsContent>
      </Tabs>
    </div>
  );
}

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