import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { BookOpenText, Layers, Sparkles, Users } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mandarin Lab — open-source Chinese learning" },
      { name: "description", content: "Flashcards, reading practice, and community collections to learn Mandarin." },
      { property: "og:title", content: "Mandarin Lab" },
      { property: "og:description", content: "Open-source platform for learning Chinese: flashcards, reading, collections." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      <section className="grid gap-10 py-16 sm:py-24 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="mb-3 font-hanzi text-sm tracking-widest text-primary">学中文 · OPEN SOURCE</p>
          <h1 className="font-serif-display text-5xl font-semibold leading-tight tracking-tight sm:text-6xl">
            Learn Mandarin <span className="text-primary">deliberately.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            Flashcards with three-step reveal, progressive reading practice, and
            community-built collections. Built in the open — fork it, improve it, share decks.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg"><Link to="/auth">Start learning</Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/browse">Browse content</Link></Button>
          </div>
        </div>

        <div className="paper relative grid place-items-center rounded-3xl p-10 shadow-sm">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Sample card</p>
          <p className="mt-6 hanzi-xl">你好</p>
          <p className="mt-4 text-xl font-medium text-primary">nǐ hǎo</p>
          <p className="mt-2 text-muted-foreground">hello</p>
          <div className="mt-8 grid w-full grid-cols-4 gap-1 text-xs">
            <kbd className="rounded border border-border bg-background px-2 py-1 text-center">Again</kbd>
            <kbd className="rounded border border-border bg-background px-2 py-1 text-center">Hard</kbd>
            <kbd className="rounded border border-border bg-background px-2 py-1 text-center">Good</kbd>
            <kbd className="rounded border border-border bg-background px-2 py-1 text-center">Easy</kbd>
          </div>
        </div>
      </section>

      <section className="grid gap-6 pb-24 sm:grid-cols-2 lg:grid-cols-4">
        <Feature icon={<Layers />} title="Three-step reveal" body="Chinese → +Pinyin → +English. Build recall, not just recognition." />
        <Feature icon={<BookOpenText />} title="Reading practice" body="Paragraphs and lessons with progressive Pinyin and translation reveal." />
        <Feature icon={<Sparkles />} title="Smart collections" body="Favorites, difficult words, and items you're struggling with — auto-curated." />
        <Feature icon={<Users />} title="Community" body="Contribute words, sentences, and lessons. Clone and share decks." />
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
