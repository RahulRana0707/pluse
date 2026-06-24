"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Copy, Check, Pencil } from "lucide-react";
import { toast } from "sonner";
import { getArticle } from "@/lib/actions/articles";
import { buildXArticleMarkdown, type SavedArticleData } from "@/lib/articles/types";
import { MarkdownPreview } from "@/components/articles/markdown-preview";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<SavedArticleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getArticle(id)
      .then((res) => setData(res?.data ?? null))
      .catch(() => toast.error("Couldn't load this article."))
      .finally(() => setLoading(false));
  }, [id]);

  const copyForX = () => {
    if (!data) return;
    navigator.clipboard.writeText(
      buildXArticleMarkdown({
        workingTitle: data.workingTitle,
        previewHook: data.previewHook,
        bodyMarkdown: data.bodyMarkdown,
      }),
    );
    setCopied(true);
    toast.success("Article Markdown copied — paste into X.");
    setTimeout(() => setCopied(false), 1500);
  };

  if (loading) return <Skeleton className="h-[480px] w-full rounded-2xl" />;

  if (!data) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink />
        <Card className="flex min-h-[300px] items-center justify-center rounded-2xl border-dashed p-8 text-center text-sm text-muted-foreground">
          This article couldn&apos;t be found.
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BackLink />
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={copyForX} className="active-scale gap-1.5 rounded-xl">
            {copied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
            Copy for X
          </Button>
          <Link href={`/dashboard/articles/${id}/edit`}>
            <Button className="active-scale gap-1.5 rounded-xl font-semibold">
              <Pencil className="size-4" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      <Card className="rounded-2xl bg-card p-6 sm:p-8">
        <article className="flex flex-col gap-4">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {data.workingTitle || "Untitled article"}
          </h1>
          {data.previewHook && (
            <blockquote className="border-l-2 border-primary/40 pl-3 text-sm italic text-muted-foreground">
              {data.previewHook.split("\n").map((line, i) => (
                <span key={i} className="block">
                  {line}
                </span>
              ))}
            </blockquote>
          )}
          <MarkdownPreview markdown={data.bodyMarkdown} />
        </article>
      </Card>
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/dashboard/articles" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="size-4" />
      All articles
    </Link>
  );
}
