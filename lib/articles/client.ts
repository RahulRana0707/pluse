"use client";

/**
 * Client-side article AI calls. Each posts to /api/ai with the right task so
 * the server routes it to the correct NVIDIA model (reasoning → DeepSeek for
 * planning/slots, writing → gpt-oss for prose/prompts), then parses the result.
 */

import {
  buildArticlePlanSystem,
  buildArticlePlanUser,
  buildArticleExpandSystem,
  buildArticleExpandUser,
  buildArticleImageSlotsSystem,
  buildArticleImageSlotsUser,
  buildArticleImagePromptsSystem,
  buildArticleImagePromptsUser,
} from "@/lib/articles/prompts";
import type {
  ArticleIntent,
  ArticleOutlineSection,
  GeneratedImagePrompt,
  ImageSlotBundle,
} from "@/lib/articles/types";

async function callAI(systemInstruction: string, prompt: string, task: string): Promise<string> {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, systemInstruction, formatJson: true, task }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "The AI request failed.");
  }
  return (await res.json()).text as string;
}

function parseJson<T>(text: string): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    // Tolerate stray prose around the JSON object.
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as T;
    throw new Error("The model returned invalid JSON. Try again.");
  }
}

export type ArticlePlan = {
  workingTitle: string;
  titleVariants: string[];
  previewHook: string;
  outline: ArticleOutlineSection[];
};

export async function runPlan(intent: ArticleIntent): Promise<ArticlePlan> {
  const text = await callAI(buildArticlePlanSystem(), buildArticlePlanUser(intent), "insights");
  const plan = parseJson<ArticlePlan>(text);
  if (!plan.workingTitle || !plan.previewHook || !Array.isArray(plan.outline) || !plan.outline.length) {
    throw new Error("The plan came back incomplete. Try again.");
  }
  return {
    workingTitle: plan.workingTitle,
    titleVariants: Array.isArray(plan.titleVariants) ? plan.titleVariants : [],
    previewHook: plan.previewHook,
    outline: plan.outline,
  };
}

/** Accept {markdown} JSON, fenced markdown, or raw markdown. */
function extractMarkdown(raw: string): string {
  try {
    const obj = JSON.parse(raw);
    if (obj && typeof obj.markdown === "string" && obj.markdown.trim()) return obj.markdown;
  } catch {
    /* not JSON — fall through */
  }
  const fenced = raw.match(/```(?:markdown|md)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]?.trim()) return fenced[1].trim();
  return raw.trim();
}

export async function runExpand(
  options: {
    intent: ArticleIntent;
    workingTitle: string;
    previewHook: string;
    outline: ArticleOutlineSection[];
  },
  onToken?: (partial: string) => void,
): Promise<string> {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: buildArticleExpandUser(options),
      systemInstruction: buildArticleExpandSystem(),
      task: "generic",
      stream: true,
    }),
  });
  if (!res.ok || !res.body) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "The AI request failed.");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let raw = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    raw += decoder.decode(value, { stream: true });
    onToken?.(extractMarkdown(raw));
  }

  const markdown = extractMarkdown(raw);
  if (!markdown) throw new Error("The article body came back empty. Try again.");
  return markdown;
}

export async function runImageSlots(options: {
  topic: string;
  workingTitle: string;
  previewHook?: string;
  articleMarkdown?: string;
}): Promise<ImageSlotBundle> {
  const text = await callAI(buildArticleImageSlotsSystem(), buildArticleImageSlotsUser(options), "insights");
  const slots = parseJson<ImageSlotBundle>(text);
  if (!slots.tension || !slots.mood || !slots.metaphor || !slots.composition) {
    throw new Error("Slot suggestions came back incomplete. Try again.");
  }
  return slots;
}

export async function runImagePrompts(options: {
  workingTitle: string;
  previewHook: string;
  articleMarkdown: string;
}): Promise<GeneratedImagePrompt[]> {
  const text = await callAI(buildArticleImagePromptsSystem(), buildArticleImagePromptsUser(options), "generic");
  const parsed = parseJson<{ prompts: GeneratedImagePrompt[] }>(text);
  const prompts = (parsed.prompts ?? [])
    .filter((p) => p?.promptText?.trim())
    .map((p, i) => ({
      id: p.id || `generated_${i + 1}`,
      label: p.label || `Prompt ${i + 1}`,
      promptText: p.promptText.trim(),
      source: "generated" as const,
    }));
  if (!prompts.length) throw new Error("No image prompts were generated. Try again.");
  return prompts;
}
