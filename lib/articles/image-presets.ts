/**
 * Built-in hero-image prompts for X Articles, for use in external AI image
 * tools (Midjourney, etc.). Slot-fill with `interpolateArticleImagePrompt`.
 */

export type ArticleImagePresetId =
  | "etching_baseline"
  | "split_tension"
  | "curiosity_gap"
  | "scale_awe"
  | "cinematic_operator"
  | "contrarian_collision"
  | "signal_noise"
  | "social_energy"
  | "urgency_motion"
  | "poster_thumb";

export type ArticleImageSlots = {
  topic: string;
  tension?: string;
  metaphor?: string;
  mood?: string;
  composition_hint?: string;
};

const NEGATIVES = "No text, no letters, no numbers, no logos, no watermarks, no UI chrome.";

export const IMAGE_PROMPT_PRESETS: {
  id: ArticleImagePresetId;
  label: string;
  description: string;
  template: string;
}[] = [
  {
    id: "etching_baseline",
    label: "Etching / woodcut (baseline)",
    description: "Symbolic B&W illustration, conceptual tension, timeless metaphor.",
    template: `Create a high-quality black-and-white illustration in a detailed etching / stippling / woodcut style.

Visualize {{topic}} as a symbolic, conceptual scene, not literal.

Introduce a clear conceptual tension related to {{topic}}, such as: {{tension}}

The environment should feel vast, dramatic, and expressive, using swirling textures, flowing lines, and heavy grain to amplify meaning.

Style notes:
– Pure monochrome (black and white only)
– Hand-drawn engraving / ink / woodcut aesthetic
– High contrast, ink-heavy, dense texture
– Cinematic lighting with sharp highlights and deep shadows
– ${NEGATIVES}

Composition hint: {{composition_hint}}`,
  },
  {
    id: "split_tension",
    label: "Split tension (before/after)",
    description: "Two halves, abstract state A vs B — instant narrative, feed contrast.",
    template: `Cinematic abstract illustration, strong horizontal or vertical split composition.

Left side: chaotic, dense, turbulent forms suggesting overload related to {{topic}}.
Right side: calm, ordered, spacious forms suggesting clarity and resolution.

Conceptual tension: {{tension}}. Mood: {{mood}}.

Style: high contrast, dramatic lighting across the split seam, subtle film grain. No literal devices or readable screens.

${NEGATIVES}

Metaphor focus: {{metaphor}}. {{composition_hint}}`,
  },
  {
    id: "curiosity_gap",
    label: "Curiosity gap",
    description: "Incomplete story — door ajar, path vanishing; drives dwell.",
    template: `Surreal symbolic illustration for {{topic}}.

Show an incomplete journey: a doorway slightly open onto darkness, a path that dissolves into mist, or a figure paused before the unknown. Emphasize mystery and anticipation, not explanation.

Tension: {{tension}}. Metaphor: {{metaphor}}.

Atmospheric, painterly or engraved texture, deep shadows, single focal point. Emotional tone: {{mood}}.

${NEGATIVES}

{{composition_hint}}`,
  },
  {
    id: "scale_awe",
    label: "Scale & awe",
    description: "Tiny figure vs giant form — big-topic / AI energy.",
    template: `Epic wide-angle symbolic scene for {{topic}}.

A very small human silhouette stands before an enormous geometric or organic mass — awe, ambition, facing the infinite.

Sky or void with dramatic depth; dust, mist, or particles for scale.

Tension: {{tension}}. Mood: {{mood}}.

Rich detail in the giant form; tiny figure for contrast.

${NEGATIVES}

{{metaphor}}. {{composition_hint}}`,
  },
  {
    id: "cinematic_operator",
    label: "Cinematic operator",
    description: "Night desk / builder mood — credibility without fake metrics.",
    template: `Moody cinematic illustration: late-night workspace, rain-streaked window with soft city bokeh, single warm desk lamp.

A figure in silhouette at a keyboard; secondary monitor as an abstract glowing rectangle — no readable text.

Abstract floating shapes suggesting data (curves, bars as pure geometry, blurred, not legible).

Atmosphere: focus, craft, building in the dark. Relates to {{topic}}. Mood: {{mood}}. Tension: {{tension}}.

${NEGATIVES}

{{metaphor}}. {{composition_hint}}`,
  },
  {
    id: "contrarian_collision",
    label: "Contrarian collision",
    description: "Two forces colliding — reply-prone emotional energy.",
    template: `Dynamic abstract composition: two massive forms colliding or grinding — fire vs ice, circle vs square, wave vs wall — representing opposing takes on {{topic}}.

Explosive diagonal energy, motion blur as abstract streaks only.

Palette: limited, high drama. No symbols that look like letters.

Tension: {{tension}}. Metaphor: {{metaphor}}. Mood: {{mood}}.

${NEGATIVES}

{{composition_hint}}`,
  },
  {
    id: "signal_noise",
    label: "Signal vs noise",
    description: "Clarity cutting through static — 'cut through noise' articles.",
    template: `Abstract visualization for {{topic}}: on one side, chaotic static and noise; a clean beam or column cuts through to the other side — clarity, focus, signal.

High contrast; monochrome or duotone. Sci-fi minimal, not cheesy holograms.

Tension: {{tension}}. Mood: {{mood}}.

${NEGATIVES}

{{metaphor}}. {{composition_hint}}`,
  },
  {
    id: "social_energy",
    label: "Social energy",
    description: "Crowd vs lone focal — movement / FOMO without identifiable faces.",
    template: `Symbolic illustration for {{topic}}: abstract crowd as repeating silhouettes or blurred masses facing a single bright opening — energy of many toward one idea.

No recognizable faces; backs of heads or pure shapes only.

Tension: {{tension}}. Mood: {{mood}}. Theater lighting, strong depth.

${NEGATIVES}

{{metaphor}}. {{composition_hint}}`,
  },
  {
    id: "urgency_motion",
    label: "Urgency & motion",
    description: "Diagonals, storm, abstract urgency — no readable clocks.",
    template: `High-energy abstract scene for {{topic}}: diagonal composition, storm clouds or wind as stylized shapes, motion streaks, a figure pushed forward by invisible force.

No clocks with digits; no text. Deadline and momentum through weather and vectors only.

Tension: {{tension}}. Mood: {{mood}}.

${NEGATIVES}

{{metaphor}}. {{composition_hint}}`,
  },
  {
    id: "poster_thumb",
    label: "Poster (thumbnail legibility)",
    description: "2–3 flat colors, bold shapes — reads at tiny card size.",
    template: `Bold graphic poster style for {{topic}}: maximum readability at small thumbnail size.

Flat shapes, 2–3 colors maximum, minimal detail, strong silhouette.

Iconic central symbol related to {{topic}} as pure shape — not literal photo.

Tension suggested through composition only: {{tension}}.

${NEGATIVES}

Mood: {{mood}}. {{metaphor}}. {{composition_hint}}`,
  },
];

export const IMAGE_ASPECT_OPTIONS: { id: string; label: string; promptLine: string }[] = [
  {
    id: "5_2",
    label: "5:2 — X Article cover (recommended)",
    promptLine:
      "Aspect ratio 5:2 (2.5:1) ultra-wide landscape; compose for an X/Twitter Article hero — subject center-weighted, extra horizontal bleed for crop safety.",
  },
  {
    id: "16_9",
    label: "16:9 — Widescreen",
    promptLine: "Aspect ratio 16:9 landscape; cinematic wide framing with clear focal hierarchy.",
  },
  {
    id: "3_2",
    label: "3:2 — Photo classic",
    promptLine: "Aspect ratio 3:2 landscape; photographic composition, natural margins.",
  },
  { id: "1_1", label: "1:1 — Square", promptLine: "Aspect ratio 1:1 square; balanced central composition." },
  {
    id: "4_5",
    label: "4:5 — Portrait feed",
    promptLine: "Aspect ratio 4:5 portrait; vertical hero, strong top-to-bottom flow.",
  },
  { id: "none", label: "No aspect line (tool default)", promptLine: "" },
];

export function getAspectPromptLine(aspectId: string): string {
  return IMAGE_ASPECT_OPTIONS.find((o) => o.id === aspectId)?.promptLine?.trim() ?? "";
}

export function appendAspectToImagePrompt(base: string, aspectId: string): string {
  const line = getAspectPromptLine(aspectId);
  const b = base.trim();
  return line ? `${b}\n\n${line}` : b;
}

const DEFAULT_SLOTS = {
  tension: "order vs chaos — resolve toward clarity",
  metaphor: "a single focal metaphor that fits the topic",
  mood: "serious, determined, forward-looking",
  composition_hint: "center-weighted, strong silhouette, generous negative space",
};

export function interpolateArticleImagePrompt(
  presetId: ArticleImagePresetId,
  slots: ArticleImageSlots,
): string {
  const preset = IMAGE_PROMPT_PRESETS.find((p) => p.id === presetId);
  if (!preset) throw new Error(`Unknown preset: ${presetId}`);
  return preset.template
    .replace(/\{\{topic\}\}/g, slots.topic.trim() || "the subject")
    .replace(/\{\{tension\}\}/g, (slots.tension ?? DEFAULT_SLOTS.tension).trim())
    .replace(/\{\{metaphor\}\}/g, (slots.metaphor ?? DEFAULT_SLOTS.metaphor).trim())
    .replace(/\{\{mood\}\}/g, (slots.mood ?? DEFAULT_SLOTS.mood).trim())
    .replace(/\{\{composition_hint\}\}/g, (slots.composition_hint ?? DEFAULT_SLOTS.composition_hint).trim());
}

export function allPresetsForDisplay(slots: ArticleImageSlots, usePlaceholdersOnly: boolean) {
  return IMAGE_PROMPT_PRESETS.map((p) => ({
    id: p.id,
    label: p.label,
    description: p.description,
    prompt: usePlaceholdersOnly ? p.template : interpolateArticleImagePrompt(p.id, slots),
  }));
}
