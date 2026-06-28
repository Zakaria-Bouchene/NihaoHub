import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getText } from "@/lib/content.functions";
import { Button } from "@/components/ui/button";
import { FlagButtons } from "@/components/FlagButtons";

const textQ = (id: string) => queryOptions({ queryKey: ["text", id], queryFn: () => getText({ data: { id } }) });

export const Route = createFileRoute("/_authenticated/reading/$id")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(textQ(params.id)),
  component: TextReader,
});

function splitParagraphs(content: string, pinyin: string | null) {
  const paras = content.split(/\n+/).filter(Boolean);
  const pinParas = pinyin ? pinyin.split(/\n+/).filter(Boolean) : [];
  return paras.map((p, i) => ({ chinese: p, pinyin: pinParas[i] ?? "" }));
}

function TextReader() {
  const { id } = Route.useParams();
  const text = useSuspenseQuery(textQ(id)).data;
  const [reveal, setReveal] = useState<0 | 1 | 2>(0);

  const paragraphs = splitParagraphs(text.content, text.pinyin ?? null);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Link to="/reading" className="text-sm text-muted-foreground hover:text-foreground">← All lessons</Link>
          <h1 className="mt-2 font-serif-display text-3xl font-semibold">{text.title}</h1>
        </div>
        <FlagButtons itemKind="text" itemId={text.id} />
      </div>

      <article className="paper space-y-6 rounded-2xl p-8">
        {paragraphs.map((p, i) => (
          <div key={i} className="space-y-2">
            <p className="hanzi-lg leading-relaxed">{p.chinese}</p>
            {reveal >= 1 && p.pinyin && (
              <p className="text-base leading-relaxed text-primary">{p.pinyin}</p>
            )}
          </div>
        ))}
        {reveal >= 2 && (
          <div className="mt-8 border-t border-border pt-6">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Translation</p>
            <p className="mt-2 leading-relaxed text-muted-foreground">{text.translation}</p>
          </div>
        )}
      </article>

      <div className="mt-6 flex justify-center gap-2">
        {reveal < 2 ? (
          <Button size="lg" onClick={() => setReveal((r) => (r === 0 ? 1 : 2))}>
            Reveal {reveal === 0 ? "Pinyin" : "Translation"}
          </Button>
        ) : (
          <Button variant="outline" size="lg" onClick={() => setReveal(0)}>Hide all</Button>
        )}
      </div>
    </div>
  );
}