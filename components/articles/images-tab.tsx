"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Sparkles, Copy, Check, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  IMAGE_ASPECT_OPTIONS,
  allPresetsForDisplay,
  appendAspectToImagePrompt,
} from "@/lib/articles/image-presets";
import type { useArticle } from "@/hooks/use-article";

const SLOTS = [
  { key: "imageTension", label: "Tension", placeholder: "signal vs noise" },
  { key: "imageMood", label: "Mood", placeholder: "quiet focus" },
  { key: "imageMetaphor", label: "Metaphor", placeholder: "a beam cutting through fog" },
  { key: "imageComposition", label: "Composition", placeholder: "wide, subject lower third" },
] as const;

export function ImagesTab({ article }: { article: ReturnType<typeof useArticle> }) {
  const { data, update, suggestSlots, generatePrompts, busy } = article;
  const [usePlaceholders, setUsePlaceholders] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success("Prompt copied.");
    setTimeout(() => setCopied((c) => (c === id ? null : c)), 1500);
  };

  const slots = {
    topic: data.topic,
    tension: data.imageTension,
    mood: data.imageMood,
    metaphor: data.imageMetaphor,
    composition_hint: data.imageComposition,
  };
  const presets = allPresetsForDisplay(slots, usePlaceholders);

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-muted-foreground">
        Hero-image prompts to paste into an external AI image tool (Midjourney, etc.). Pulse
        doesn&apos;t generate images — it writes the prompts.
      </p>

      {/* Aspect + AI slots */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Aspect ratio</label>
            <Select
              value={data.imageAspectRatioId}
              onValueChange={(v) => update({ imageAspectRatioId: v })}
            >
              <SelectTrigger className="h-9 w-72 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                {IMAGE_ASPECT_OPTIONS.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            onClick={suggestSlots}
            disabled={busy === "slots"}
            className="active-scale gap-1.5 rounded-xl"
          >
            {busy === "slots" ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
            Suggest slots with AI
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {SLOTS.map((s) => (
            <div key={s.key} className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">{s.label}</label>
              <Input
                value={data[s.key]}
                onChange={(e) => update({ [s.key]: e.target.value })}
                placeholder={s.placeholder}
              />
            </div>
          ))}
        </div>
      </div>

      {/* AI-generated prompts from the article */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-foreground">Prompts from your article</h4>
          <Button
            onClick={generatePrompts}
            disabled={busy === "prompts" || !data.bodyMarkdown.trim()}
            className="active-scale gap-1.5 rounded-xl"
          >
            {busy === "prompts" ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            Generate 3–5 prompts
          </Button>
        </div>
        {data.generatedImagePrompts.length > 0 && (
          <div className="flex flex-col gap-2">
            {data.generatedImagePrompts.map((p) => (
              <PromptCard
                key={p.id}
                id={p.id}
                label={p.label}
                badge="AI"
                text={appendAspectToImagePrompt(p.promptText, data.imageAspectRatioId)}
                copied={copied === p.id}
                onCopy={copy}
              />
            ))}
          </div>
        )}
      </div>

      {/* Built-in presets */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-foreground">Built-in styles</h4>
          <button
            onClick={() => setUsePlaceholders((v) => !v)}
            className="text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            {usePlaceholders ? "Show filled-in" : "Show {{placeholders}}"}
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {presets.map((p) => (
            <PromptCard
              key={p.id}
              id={p.id}
              label={p.label}
              description={p.description}
              text={appendAspectToImagePrompt(p.prompt, data.imageAspectRatioId)}
              copied={copied === p.id}
              onCopy={copy}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function PromptCard({
  id,
  label,
  description,
  badge,
  text,
  copied,
  onCopy,
}: {
  id: string;
  label: string;
  description?: string;
  badge?: string;
  text: string;
  copied: boolean;
  onCopy: (id: string, text: string) => void;
}) {
  return (
    <Card className="flex flex-col gap-2 rounded-xl bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{label}</span>
          {badge && (
            <Badge variant="secondary" className="text-[9px]">
              {badge}
            </Badge>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onCopy(id, text)}
          className={cn("active-scale h-7 gap-1 px-2 text-[11px]", copied && "text-emerald-500")}
        >
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      <p className="line-clamp-3 whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-muted-foreground">
        {text}
      </p>
    </Card>
  );
}
