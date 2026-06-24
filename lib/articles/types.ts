/** Shared article-journey types (safe for server + client). */

export type ArticleOutlineSection = { id: string; title: string; beats: string };

export type ArticleWizardStep = "intent" | "card" | "body" | "images" | "save";

export type GeneratedImagePrompt = {
  id: string;
  label: string;
  promptText: string;
  source?: "generated";
};

export type ImageSlotBundle = {
  tension: string;
  mood: string;
  metaphor: string;
  composition: string;
};

export type ArticleIntent = {
  topic: string;
  audience?: string;
  tone?: string;
  promise?: string;
};

/** Persisted JSON for `Article.data`. Keep in sync with the wizard hook. */
export type SavedArticleData = {
  topic: string;
  audience: string;
  tone: string;
  promise: string;
  workingTitle: string;
  titleVariants: string[];
  previewHook: string;
  outline: ArticleOutlineSection[];
  bodyMarkdown: string;
  imageTension: string;
  imageMood: string;
  imageMetaphor: string;
  imageComposition: string;
  imageAspectRatioId: string;
  generatedImagePrompts: GeneratedImagePrompt[];
  wizardStep: ArticleWizardStep;
};

export function defaultSavedArticleData(): SavedArticleData {
  return {
    topic: "",
    audience: "",
    tone: "",
    promise: "",
    workingTitle: "",
    titleVariants: [],
    previewHook: "",
    outline: [],
    bodyMarkdown: "",
    imageTension: "",
    imageMood: "",
    imageMetaphor: "",
    imageComposition: "",
    imageAspectRatioId: "5_2",
    generatedImagePrompts: [],
    wizardStep: "intent",
  };
}

/** Merge stored JSON with defaults so older snapshots stay compatible. */
export function normalizeSavedArticleData(raw: unknown): SavedArticleData {
  const base = defaultSavedArticleData();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Partial<SavedArticleData>;
  return {
    ...base,
    ...r,
    titleVariants: Array.isArray(r.titleVariants) ? r.titleVariants : base.titleVariants,
    outline: Array.isArray(r.outline) ? r.outline : base.outline,
    generatedImagePrompts: Array.isArray(r.generatedImagePrompts)
      ? r.generatedImagePrompts
      : base.generatedImagePrompts,
    imageAspectRatioId: r.imageAspectRatioId ?? base.imageAspectRatioId,
    wizardStep: r.wizardStep ?? base.wizardStep,
  };
}

export function deriveArticleListTitle(data: SavedArticleData): string {
  return data.workingTitle.trim() || data.topic.trim() || "Untitled article";
}

/** Markdown bundle for X Articles: H1 title, blockquote hook, body. */
export function buildXArticleMarkdown(input: {
  workingTitle: string;
  previewHook: string;
  bodyMarkdown: string;
}): string {
  const header = `# ${input.workingTitle.trim() || "Untitled"}\n\n`;
  const hook = input.previewHook.trim()
    ? `> ${input.previewHook.trim().split("\n").join("\n> ")}\n\n`
    : "";
  return `${header}${hook}${input.bodyMarkdown.trim()}`;
}
