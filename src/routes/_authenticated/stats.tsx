import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getStats } from "@/lib/authed.functions";
import { Card } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/_authenticated/stats")({
  component: StatsPage,
});

function StatsPage() {
  const fn = useServerFn(getStats);
  const { data } = useQuery({ queryKey: ["stats"], queryFn: () => fn() });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-serif-display text-3xl font-semibold">Your learning</h1>
      <p className="mt-1 text-muted-foreground">Last 1000 reviews.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <Stat label="Total reviews" value={data?.total ?? 0} />
        <Stat label="Good" value={data?.byRating.good ?? 0} accent="text-accent" />
        <Stat label="Easy" value={data?.byRating.easy ?? 0} accent="text-accent" />
        <Stat label="Again" value={data?.byRating.again ?? 0} accent="text-primary" />
      </div>

      <Card className="mt-8 p-5">
        <h2 className="font-serif-display text-lg font-semibold">Reviews · last 14 days</h2>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.last14 ?? []}>
              <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
              <Tooltip cursor={{ fill: "var(--color-muted)" }} contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
              <Bar dataKey="count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`mt-1 font-serif-display text-3xl font-semibold ${accent ?? ""}`}>{value}</p>
    </Card>
  );
}