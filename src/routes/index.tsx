import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpenText, Layers, Sparkles, Users, ArrowRight } from "lucide-react";
import { LANGUAGES, getLanguage, getSampleCard, getStoredPair, setStoredPair } from "@/lib/languages";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export const Route = createFileRoute("/")(({
  head: () => ({
    meta: [
      { title: "LangsHub — open-source multilanguage learning" },
      { name: "description", content: "Flashcards, reading practice, and community collections. Learn any language with a three-step reveal system." },
      { property: "og:title", content: "LangsHub" },
      { property: "og:description", content: "Open-source platform to learn any language: flashcards, reading, community collections." },
    ],
  }),
  component: Index,
}));

function Index() {
  const navigate = useNavigate();
  const stored = getStoredPair();
  const [sourceLang, setSourceLang] = useState(stored.sourceLang);
  const [targetLang, setTargetLang] = useState(stored.targetLang);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthed(!!user);
    });
    return () => unsubscribe();
  }, []);

  const sample = getSampleCard(sourceLang, targetLang);
  const targetLangObj = getLanguage(targetLang);
  const sourceLangObj = getLanguage(sourceLang);

  // Prevent picking same language for both
  const availableTargets = LANGUAGES.filter(l => l.code !== sourceLang);
  const availableSources = LANGUAGES.filter(l => l.code !== targetLang);

  function handleSourceChange(val: string) {
    setSourceLang(val);
    if (val === targetLang) setTargetLang(LANGUAGES.find(l => l.code !== val)?.code ?? "es");
  }
  function handleTargetChange(val: string) {
    setTargetLang(val);
    if (val === sourceLang) setSourceLang(LANGUAGES.find(l => l.code !== val)?.code ?? "en");
  }

  function handleStart() {
    setStoredPair(sourceLang, targetLang);
    navigate({ to: isAuthed ? "/study" : "/auth" });
  }

  return (
    <div className="mx-auto max-w-6xl px-4">
      {/* ── Hero ── */}
      <section className="grid gap-10 py-16 sm:py-24 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="mb-3 text-sm tracking-widest text-primary uppercase">OPEN SOURCE · MULTILANGUAGE</p>
          <h1 className="font-serif-display text-5xl font-semibold leading-tight tracking-tight sm:text-6xl">
            Learn any language{" "}
            <span className="text-primary">deliberately.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            Flashcards with step-by-step reveal, reading practice, and community-built collections.
            Built in the open — fork it, improve it, share decks.
          </p>

          {/* ── Language Pair Picker ── */}
          <div className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <p className="mb-4 text-sm font-medium text-foreground">Choose your language pair</p>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">I speak</label>
                <Select value={sourceLang} onValueChange={handleSourceChange}>
                  <SelectTrigger id="source-lang" className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSources.map(l => (
                      <SelectItem key={l.code} value={l.code}>
                        {l.flag} {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <ArrowRight className="mt-5 h-4 w-4 shrink-0 text-muted-foreground" />

              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">I want to learn</label>
                <Select value={targetLang} onValueChange={handleTargetChange}>
                  <SelectTrigger id="target-lang" className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTargets.map(l => (
                      <SelectItem key={l.code} value={l.code}>
                        {l.flag} {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button className="mt-4 w-full" size="lg" onClick={handleStart}>
              {isAuthed ? "Go to Study" : "Start learning"} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            {!isAuthed && (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Free account required to save progress.{" "}
                <Link to="/browse" className="underline underline-offset-2 hover:text-foreground">
                  Browse first →
                </Link>
              </p>
            )}
          </div>
        </div>

        {/* ── Sample Card (updates with language pair) ── */}
        <div className="paper relative grid place-items-center rounded-3xl p-10 shadow-sm">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Sample card</p>

          {/* Language badge */}
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
              {sourceLangObj?.flag} {sourceLangObj?.name}
            </span>
            <span>→</span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
              {targetLangObj?.flag} {targetLangObj?.name}
            </span>
          </div>

          {/* Source word */}
          <p className="mt-6 text-2xl font-medium text-foreground">{sample.sourceText}</p>

          {/* Transliteration (only if language has it) */}
          {sample.transliteration && targetLangObj?.hasTransliteration && (
            <p className="mt-4 text-xl font-medium text-primary">{sample.transliteration}</p>
          )}

          {/* Target translation */}
          <p
            className="mt-2 text-2xl text-muted-foreground"
            dir={targetLangObj?.rtl ? "rtl" : undefined}
          >
            {sample.targetText}
          </p>

          <div className="mt-8 grid w-full grid-cols-4 gap-1 text-xs">
            <kbd className="rounded border border-border bg-background px-2 py-1 text-center">Again</kbd>
            <kbd className="rounded border border-border bg-background px-2 py-1 text-center">Hard</kbd>
            <kbd className="rounded border border-border bg-background px-2 py-1 text-center">Good</kbd>
            <kbd className="rounded border border-border bg-background px-2 py-1 text-center">Easy</kbd>
          </div>
        </div>
      </section>

      {/* ── Feature Grid ── */}
      <section className="grid gap-6 pb-24 sm:grid-cols-2 lg:grid-cols-4">
        <Feature icon={<Layers />} title="Step-by-step reveal" body="Source → Romanisation (where needed) → Translation. Build recall, not just recognition." />
        <Feature icon={<BookOpenText />} title="Reading practice" body="Passages with progressive phonetic and translation reveal, for any language." />
        <Feature icon={<Sparkles />} title="Smart collections" body="Favorites, difficult words, and items you're struggling with — auto-curated." />
        <Feature icon={<Users />} title="Community" body="Contribute words, sentences, and lessons. Clone and share decks across language pairs." />
      </section>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</div>
      <h3 className="font-serif-display text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
