"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Plus, Clock } from "lucide-react";
import { toast } from "sonner";
import { listArticles } from "@/lib/actions/articles";

type Row = Awaited<ReturnType<typeof listArticles>>[number];

export default function Page() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listArticles()
      .then(setRows)
      .catch(() => toast.error("Couldn't load your articles."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Articles</h2>
          <p className="text-sm text-muted-foreground">
            Long-form X Articles — planned, drafted, and exported with AI.
          </p>
        </div>
        <Link href="/dashboard/articles/new">
          <Button className="active-scale gap-1.5 rounded-xl font-semibold">
            <Plus className="size-4" />
            New article
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : rows.length > 0 ? (
        <div className="flex flex-col gap-2">
          {rows.map((a) => (
            <Link key={a.id} href={`/dashboard/articles/${a.id}`}>
              <Card className="flex items-center justify-between gap-3 rounded-xl bg-card p-4 transition-colors hover:border-primary/30">
                <div className="flex min-w-0 items-center gap-3">
                  <FileText className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate text-sm font-medium text-foreground">{a.title}</span>
                </div>
                <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3" />
                  {new Date(a.updatedAt).toLocaleDateString()}
                </span>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-2xl border-dashed p-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-muted">
            <FileText className="size-5 text-muted-foreground" />
          </div>
          <p className="max-w-sm text-sm text-muted-foreground">
            No articles yet. Start one and let Pulse plan, draft, and prep it for X.
          </p>
          <Link href="/dashboard/articles/new">
            <Button className="active-scale mt-1 gap-1.5 rounded-xl font-semibold">
              <Plus className="size-4" />
              New article
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
