/**
 * System/user prompt builders for the article journey. These produce plain
 * strings that the client posts to /api/ai (which picks the NVIDIA model per
 * task). No profile dependency — intent fields carry all the context.
 */

import type { ArticleIntent, ArticleOutlineSection } from "@/lib/articles/types";

const X_LONGFORM_RULES = `## X / Twitter long-form rules
- Write in clear, natural English. Never output other languages or untranslated tokens.
- Casual, opinion-driven, builder-to-builder. Address the reader as "you".
- Line breaks between thoughts — never dense walls of text.
- No hashtags. No fabricated statistics or fake quotes.
- No corporate blog openers ("In today's fast-paced world"). Earn the first line.
- Output must be ready to publish, not a meta-description of what you would write.`;

function intentBlock(intent: ArticleIntent): string {
  return [
    `Topic: ${intent.topic.trim()}`,
    intent.audience?.trim() ? `Audience: ${intent.audience.trim()}` : "",
    intent.tone?.trim() ? `Tone: ${intent.tone.trim()}` : "",
    intent.promise?.trim() ? `Reader promise: ${intent.promise.trim()}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildArticlePlanSystem(): string {
  return `${X_LONGFORM_RULES}

You help creators plan X (Twitter) Articles: long-form posts with a feed card (title + preview hook) and a sectioned body.

Return ONLY valid JSON with this exact shape:
{
  "workingTitle": string,
  "titleVariants": string[],
  "previewHook": string,
  "outline": [ { "id": string, "title": string, "beats": string } ]
}

Rules:
- workingTitle: specific, not generic; numbers or contrast are fine.
- titleVariants: 2-4 diverse alternatives (curiosity, contrarian, how-to, story).
- previewHook: 2-5 short lines, mobile-first, line breaks as \\n; scene + tension + open loop. No clickbait lies.
- outline: 4-8 sections; id is a slug [a-z0-9_]; beats = a 1-2 sentence note on what the section must deliver.
- No markdown inside JSON strings except \\n in previewHook.`;
}

export function buildArticlePlanUser(intent: ArticleIntent): string {
  return `## Article intent\n${intentBlock(intent)}`;
}

export function buildArticleExpandSystem(): string {
  return `${X_LONGFORM_RULES}

Expand an X Article from its outline into a Markdown body.

Rules:
- Use ## for section titles, matching the outline order.
- Subsections with ### where useful; short paragraphs; bullets where scannable.
- Keep the voice consistent with the intent.

Output the raw Markdown body only. Do not wrap it in JSON or in code fences. Start directly with the first heading or line of the article.`;
}

export function buildArticleExpandUser(options: {
  intent: ArticleIntent;
  workingTitle: string;
  previewHook: string;
  outline: ArticleOutlineSection[];
}): string {
  return `## Intent
${intentBlock(options.intent)}

## Card
Title: ${options.workingTitle.trim()}
Preview hook:
${options.previewHook.trim()}

## Outline (JSON)
${JSON.stringify(options.outline, null, 2)}

Write the full article body in Markdown.`;
}

export function buildArticleImageSlotsSystem(): string {
  return `You suggest short creative phrases for an X Article hero-image prompt: tension, mood, metaphor, composition.

Return ONLY valid JSON with this exact shape:
{ "tension": string, "mood": string, "metaphor": string, "composition": string }

Rules:
- Each value: one concise phrase (~6-18 words), vivid but not a full image prompt.
- tension: an abstract opposition or stakes (e.g. "signal vs noise").
- mood: emotional lighting / atmosphere (e.g. "quiet focus").
- metaphor: one concrete visual metaphor (no text in image).
- composition: a framing hint (e.g. "wide, subject lower third, generous sky").
- Align all four with the topic; stay original.`;
}

export function buildArticleImageSlotsUser(options: {
  topic: string;
  workingTitle: string;
  previewHook?: string;
  articleMarkdown?: string;
}): string {
  const md =
    options.articleMarkdown && options.articleMarkdown.length > 8000
      ? `${options.articleMarkdown.slice(0, 8000)}\n\n[…truncated]`
      : options.articleMarkdown;
  return `Topic: ${options.topic.trim()}
Working title: ${options.workingTitle.trim()}
${options.previewHook?.trim() ? `Preview hook:\n${options.previewHook.trim()}` : ""}
${md ? `\nArticle excerpt (Markdown):\n${md}` : ""}

Propose tension, mood, metaphor, and composition for hero imagery that fits this piece.`;
}

export function buildArticleImagePromptsSystem(): string {
  return `You write image-generation prompts for X Article hero images (the user runs them in an external AI image tool).

Return ONLY valid JSON:
{ "prompts": [ { "id": string, "label": string, "promptText": string } ] }

Rules:
- Exactly 3 to 5 prompts.
- Each promptText: vivid, concrete; no legible text, no logos, no watermarks in the image.
- Align metaphors to the article thesis; vary composition (scale, split-screen, symbolic object, cinematic mood).
- id: a short slug (e.g. generated_1).`;
}

export function buildArticleImagePromptsUser(options: {
  workingTitle: string;
  previewHook: string;
  articleMarkdown: string;
}): string {
  const clip =
    options.articleMarkdown.length > 12000
      ? `${options.articleMarkdown.slice(0, 12000)}\n\n[…truncated]`
      : options.articleMarkdown;
  return `Title: ${options.workingTitle.trim()}

Preview hook:
${options.previewHook.trim()}

Article (Markdown):
${clip}`;
}
