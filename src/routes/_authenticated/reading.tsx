import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listTexts } from "@/lib/content.functions";
import { Card } from "@/components/ui/card";

const textsQ = queryOptions({ queryKey: ["texts"], queryFn: () => listTexts() });

export const Route = createFileRoute("/_authenticated/reading")({
  loader: ({ context }) => { context.queryClient.ensureQueryData(textsQ); },
  component: ReadingLayout,
});

function ReadingLayout() { return <Outlet />; }

export function ReadingIndex() {
  const texts = useSuspenseQuery(textsQ).data;
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-serif-display text-3xl font-semibold">Reading practice</h1>
      <p className="mt-1 text-muted-foreground">Progressive reveal: Chinese first, then pinyin, then translation.</p>
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {texts.map(t => (
          <Link key={t.id} to="/reading/$id" params={{ id: t.id }}>
            <Card className="p-5 transition-shadow hover:shadow-md">
              <p className="font-serif-display text-xl font-semibold">{t.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">Begin reading →</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}