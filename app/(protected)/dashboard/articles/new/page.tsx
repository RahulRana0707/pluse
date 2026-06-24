"use client";

import { useRouter } from "next/navigation";
import { ArticleWizard } from "@/components/articles/article-wizard";

export default function Page() {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">New article</h2>
        <p className="text-sm text-muted-foreground">
          Plan, draft, and prep hero-image prompts for a long-form X Article — then copy it out.
        </p>
      </div>
      <ArticleWizard onSaved={(id) => router.push(`/dashboard/articles/${id}`)} />
    </div>
  );
}
