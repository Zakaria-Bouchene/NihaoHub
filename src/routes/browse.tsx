import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listWords, listSentences, listTexts } from "@/lib/content.functions";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";

const wordsQ = queryOptions({ queryKey: ["words"], queryFn: () => listWords() });
const sentsQ = queryOptions({ queryKey: ["sentences"], queryFn: () => listSentences() });
const textsQ = queryOptions({ queryKey: ["texts"], queryFn: () => listTexts() });

export const Route = createFileRoute("/browse")({
  head: () => ({ meta: [
    { title: "Browse — LangsHub" },
    { name: "description", content: "Browse community-contributed words, sentences, and reading texts." },
  ]}),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(wordsQ);
    context.queryClient.ensureQueryData(sentsQ);
    context.queryClient.ensureQueryData(textsQ);
  },
  component: BrowsePage,
});

function BrowsePage() {
  const words = useSuspenseQuery(wordsQ).data;
  const sents = useSuspenseQuery(sentsQ).data;
  const texts = useSuspenseQuery(textsQ).data;
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-serif-display text-3xl font-semibold tracking-tight">Browse the library</h1>
      <p className="mt-1 text-muted-foreground">Public content contributed by the community. Sign in to study, mark favorites, and add your own.</p>
      <Tabs defaultValue="words" className="mt-8">
        <TabsList>
          <TabsTrigger value="words">Words ({words.length})</TabsTrigger>
          <TabsTrigger value="sentences">Sentences ({sents.length})</TabsTrigger>
          <TabsTrigger value="texts">Texts ({texts.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="words">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {words.map(w => (
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
            {sents.map(s => (
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
            {texts.map(t => (
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
    </div>
  );
}