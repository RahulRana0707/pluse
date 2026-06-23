"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { getArticle } from "@/lib/actions/articles";
import { ArticleWizard } from "@/components/articles/article-wizard";
import type { SavedArticleData } from "@/lib/articles/types";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [initial, setInitial] = useState<{ id: string; data: SavedArticleData } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getArticle(id)
      .then((res) => setInitial(res ? { id: res.id, data: res.data } : null))
      .catch(() => toast.error("Couldn't load this article."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Skeleton className="h-[480px] w-full rounded-2xl" />;

  if (!initial) {
    return (
      <Card className="flex min-h-[300px] items-center justify-center rounded-2xl border-dashed p-8 text-center text-sm text-muted-foreground">
        This article couldn&apos;t be found.
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold tracking-tight text-foreground">Edit article</h2>
      <ArticleWizard initial={initial} onSaved={(savedId) => router.push(`/dashboard/articles/${savedId}`)} />
    </div>
  );
}
