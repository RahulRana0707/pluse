"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, ArrowRight, Clock, PenTool, Send, Lightbulb, Flame } from "lucide-react";
import { toast } from "sonner";
import { listDrafts } from "@/lib/actions/drafts";
import { listItems } from "@/lib/actions/creators";

type Draft = Awaited<ReturnType<typeof listDrafts>>[number];

const STAGES = ["Ideas", "Drafting", "Review", "Published"] as const;

function timeAgo(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function Page() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listDrafts(), listItems()])
      .then(([d, items]) => {
        setDrafts(d);
        setSavedCount(items.length);
      })
      .catch(() => toast.error("Couldn't load your dashboard."))
      .finally(() => setLoading(false));
  }, []);

  const byStage = useMemo(() => {
    const counts: Record<string, number> = { Ideas: 0, Drafting: 0, Review: 0, Published: 0 };
    for (const d of drafts) counts[d.status] = (counts[d.status] ?? 0) + 1;
    return counts;
  }, [drafts]);

  const recent = useMemo(
    () => [...drafts].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 5),
    [drafts],
  );

  const activeDrafts = drafts.length - (byStage.Published ?? 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Command Center</h2>
        <p className="text-sm text-muted-foreground">
          Your content pipeline at a glance — what you&apos;ve saved, what&apos;s in progress, and what to do next.
        </p>
      </div>

      {/* Real stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          loading={loading}
          icon={<Sparkles className="size-4 text-primary" />}
          label="Swipe file"
          value={savedCount}
          unit={savedCount === 1 ? "saved tweet" : "saved tweets"}
          href="/dashboard/inspiration"
        />
        <StatCard
          loading={loading}
          icon={<PenTool className="size-4 text-primary" />}
          label="Active drafts"
          value={activeDrafts}
          unit={`${byStage.Review ?? 0} in review`}
          href="/dashboard/content-os"
        />
        <StatCard
          loading={loading}
          icon={<Send className="size-4 text-primary" />}
          label="Published"
          value={byStage.Published ?? 0}
          unit="marked done"
          href="/dashboard/content-os"
        />
      </div>

      {/* Pipeline + quick actions */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-card md:col-span-2 flex flex-col">
          <CardHeader>
            <CardTitle className="text-base font-bold">Pipeline</CardTitle>
            <CardDescription>Your drafts across the Content OS board.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-5">
            <div className="grid grid-cols-4 gap-3">
              {STAGES.map((stage) => (
                <div key={stage} className="flex flex-col gap-1 rounded-xl border border-border bg-muted/40 p-3">
                  <span className="text-2xl font-bold text-foreground">
                    {loading ? "–" : byStage[stage] ?? 0}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {stage}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Recent
              </span>
              {loading ? (
                <div className="flex flex-col gap-2">
                  {[0, 1, 2].map((i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-xl" />
                  ))}
                </div>
              ) : recent.length > 0 ? (
                recent.map((d) => (
                  <Link
                    key={d.id}
                    href="/dashboard/content-os"
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 p-3 transition-colors hover:border-primary/30"
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium text-foreground">
                        {d.title || d.body.slice(0, 60) || "Untitled draft"}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3" /> {timeAgo(d.createdAt)}
                        {d.source && <span className="text-muted-foreground/60">· {d.source.split(":")[0]}</span>}
                      </span>
                    </div>
                    <Badge variant="secondary" className="shrink-0 text-[10px]">
                      {d.status}
                    </Badge>
                  </Link>
                ))
              ) : (
                <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border p-8 text-center">
                  <Sparkles className="size-5 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    No drafts yet. Generate an idea or remix a tweet to get started.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card flex flex-col">
          <CardHeader>
            <CardTitle className="text-base font-bold">Quick actions</CardTitle>
            <CardDescription>Jump into the create flow.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <QuickAction href="/dashboard/inspiration" icon={<Sparkles className="size-4" />} label="Browse swipe file" />
            <QuickAction href="/dashboard/ideas" icon={<Lightbulb className="size-4" />} label="Generate ideas" />
            <QuickAction href="/dashboard/hooks" icon={<Flame className="size-4" />} label="Score a hook" />
            <Link href="/dashboard/content-os">
              <Button className="active-scale h-10 w-full justify-between rounded-xl">
                <span>Open Content OS</span>
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  loading,
  icon,
  label,
  value,
  unit,
  href,
}: {
  loading: boolean;
  icon: React.ReactNode;
  label: string;
  value: number;
  unit: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="bg-card transition-colors hover:border-primary/30">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
          {icon}
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <div className="text-2xl font-bold text-foreground">{value}</div>
          )}
          <p className="mt-1 text-xs text-muted-foreground">{unit}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

function QuickAction({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href}>
      <Button variant="outline" className="active-scale h-10 w-full justify-between rounded-xl">
        <span className="flex items-center gap-2">
          {icon}
          {label}
        </span>
        <ArrowRight className="size-4" />
      </Button>
    </Link>
  );
}
