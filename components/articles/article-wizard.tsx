"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Plus, Trash2, Save, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useArticle } from "@/hooks/use-article";
import { ImagesTab } from "@/components/articles/images-tab";
import { MarkdownPreview } from "@/components/articles/markdown-preview";
import type { ArticleWizardStep, SavedArticleData } from "@/lib/articles/types";

const TEXTAREA =
  "w-full rounded-xl border border-input bg-background p-3 text-sm leading-relaxed text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

const STAGES: { value: ArticleWizardStep; label: string; done: (d: SavedArticleData) => boolean }[] = [
  { value: "intent", label: "Setup", done: (d) => !!d.topic.trim() },
  { value: "card", label: "Outline", done: (d) => !!d.workingTitle.trim() },
  { value: "body", label: "Draft", done: (d) => !!d.bodyMarkdown.trim() },
  { value: "images", label: "Images", done: (d) => d.generatedImagePrompts.length > 0 },
];

export function ArticleWizard({
  initial,
  onSaved,
}: {
  initial?: { id: string; data: SavedArticleData };
  onSaved: (id: string) => void;
}) {
  const article = useArticle(initial);
  const { data, update, setStep, busy, generatePlan, generateBody, save } = article;
  const step = data.wizardStep === "save" ? "images" : data.wizardStep;

  const handleSave = async () => {
    const id = await save();
    if (id) onSaved(id);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Stepper + save */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-2 pl-3">
        <div className="flex items-center gap-1">
          {STAGES.map((s, i) => {
            const active = step === s.value;
            const done = s.done(data);
            return (
              <div key={s.value} className="flex items-center">
                <button
                  onClick={() => setStep(s.value)}
                  className={cn(
                    "active-scale flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium transition-colors",
                    active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-5 items-center justify-center rounded-full text-[10px] font-bold",
                      active ? "bg-primary-foreground/20" : done ? "bg-primary/15 text-primary" : "bg-muted",
                    )}
                  >
                    {done && !active ? <Check className="size-3" /> : i + 1}
                  </span>
                  {s.label}
                </button>
                {i < STAGES.length - 1 && <span className="mx-0.5 h-px w-4 bg-border" />}
              </div>
            );
          })}
        </div>
        <Button onClick={handleSave} disabled={busy === "save"} className="active-scale gap-1.5 rounded-xl font-semibold">
          {busy === "save" ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {initial ? "Save changes" : "Save"}
        </Button>
      </div>

      {step === "images" ? (
        <ImagesTab article={article} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,440px)_1fr]">
          {/* Left: stage controls */}
          <div className="flex flex-col gap-4">
            {step === "intent" && (
              <>
                <Field label="Topic" required>
                  <Input value={data.topic} onChange={(e) => update({ topic: e.target.value })} placeholder="What's the article about?" />
                </Field>
                <Field label="Audience">
                  <Input value={data.audience} onChange={(e) => update({ audience: e.target.value })} placeholder="Indie founders" />
                </Field>
                <Field label="Tone">
                  <Input value={data.tone} onChange={(e) => update({ tone: e.target.value })} placeholder="Direct, practical" />
                </Field>
                <Field label="Reader promise">
                  <Input value={data.promise} onChange={(e) => update({ promise: e.target.value })} placeholder="What will they walk away with?" />
                </Field>
                <Button onClick={generatePlan} disabled={busy === "plan"} className="active-scale gap-1.5 rounded-xl font-semibold">
                  {busy === "plan" ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                  Generate plan
                </Button>
              </>
            )}

            {step === "card" &&
              (data.workingTitle || data.outline.length ? (
                <>
                  <Field label="Working title">
                    <Input value={data.workingTitle} onChange={(e) => update({ workingTitle: e.target.value })} />
                  </Field>
                  {data.titleVariants.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {data.titleVariants.map((t) => (
                        <button
                          key={t}
                          onClick={() => update({ workingTitle: t })}
                          className="active-scale rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                  <Field label="Preview hook">
                    <textarea rows={4} value={data.previewHook} onChange={(e) => update({ previewHook: e.target.value })} className={TEXTAREA} />
                  </Field>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">Outline</span>
                    <Button size="sm" variant="outline" onClick={article.addOutlineSection} className="active-scale h-7 gap-1 rounded-lg text-xs">
                      <Plus className="size-3" /> Section
                    </Button>
                  </div>
                  <div className="flex flex-col gap-2">
                    {data.outline.map((s) => (
                      <Card key={s.id} className="flex flex-col gap-2 rounded-xl bg-card p-3">
                        <div className="flex items-center gap-2">
                          <Input value={s.title} onChange={(e) => article.updateOutlineSection(s.id, { title: e.target.value })} placeholder="Section title" className="h-8" />
                          <Button size="icon" variant="ghost" onClick={() => article.removeOutlineSection(s.id)} className="active-scale size-8 shrink-0 text-destructive hover:bg-destructive/10">
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                        <Input value={s.beats} onChange={(e) => article.updateOutlineSection(s.id, { beats: e.target.value })} placeholder="What this section delivers" className="h-8 text-xs" />
                      </Card>
                    ))}
                  </div>
                  <Button onClick={generateBody} disabled={busy === "expand"} className="active-scale gap-1.5 rounded-xl font-semibold">
                    {busy === "expand" ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                    Generate draft
                  </Button>
                </>
              ) : (
                <EmptyHint>Generate a plan on the Setup step first.</EmptyHint>
              ))}

            {step === "body" &&
              (data.bodyMarkdown || busy === "expand" ? (
                <Field
                  label={
                    busy === "expand" ? "Writing your draft…" : "Markdown — edit freely, preview updates live"
                  }
                >
                  <textarea
                    rows={24}
                    value={data.bodyMarkdown}
                    onChange={(e) => update({ bodyMarkdown: e.target.value })}
                    placeholder={busy === "expand" ? "Generating…" : undefined}
                    className={`${TEXTAREA} min-h-[480px] font-mono`}
                  />
                </Field>
              ) : (
                <EmptyHint>Generate the draft from the Outline step first.</EmptyHint>
              ))}
          </div>

          {/* Right: live article preview */}
          <Card className="h-fit rounded-2xl bg-card p-6 lg:sticky lg:top-4">
            <ArticleDoc data={data} />
          </Card>
        </div>
      )}
    </div>
  );
}

function ArticleDoc({ data }: { data: SavedArticleData }) {
  if (!data.workingTitle && !data.previewHook && !data.bodyMarkdown) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-2 text-center">
        <Sparkles className="size-6 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Your article appears here as you build it.</p>
      </div>
    );
  }
  return (
    <article className="flex flex-col gap-4">
      {data.workingTitle && <h1 className="text-2xl font-bold tracking-tight text-foreground">{data.workingTitle}</h1>}
      {data.previewHook && (
        <blockquote className="border-l-2 border-primary/40 pl-3 text-sm italic text-muted-foreground">
          {data.previewHook.split("\n").map((line, i) => (
            <span key={i} className="block">
              {line}
            </span>
          ))}
        </blockquote>
      )}
      {data.bodyMarkdown ? (
        <MarkdownPreview markdown={data.bodyMarkdown} />
      ) : data.outline.length > 0 ? (
        <ol className="flex flex-col gap-1.5 text-sm text-muted-foreground">
          {data.outline.map((s) => (
            <li key={s.id} className="flex gap-2">
              <span className="text-muted-foreground/50">{"•"}</span>
              <span>{s.title || "Untitled section"}</span>
            </li>
          ))}
        </ol>
      ) : null}
    </article>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-muted-foreground">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </label>
      {children}
    </div>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <Card className="flex min-h-[200px] items-center justify-center rounded-2xl border-dashed p-8 text-center text-sm text-muted-foreground">
      {children}
    </Card>
  );
}
