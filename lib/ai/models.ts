/**
 * Model strategy for the NVIDIA-hosted open models used across Pulse.
 *
 * Both models are served through the same NVIDIA endpoint (one API key, one
 * base URL) — only the model name and sampling profile change per task. The
 * strategy maps a task to the model whose strengths fit it:
 *
 *   - DeepSeek V4 Pro     -> reasoning, ideation, trend/competitor analysis, scoring
 *   - OpenAI gpt-oss-120b -> writing, voice, hooks, final post drafts
 *
 * See README "AI Systems": ideation/analysis feeds writing, so we route the
 * analytical tasks to DeepSeek and the creative/voice tasks to the writer.
 *
 * Note: Kimi K2.6 was the previous writing pick but frequently emitted
 * non-English (CJK) tokens in its output; OpenAI's open-weight gpt-oss-120b is
 * reliably English and high-quality. Swap WRITER below to retune the voice.
 */

export const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";

const DEEPSEEK = "deepseek-ai/deepseek-v4-pro";
const WRITER = "openai/gpt-oss-120b";

export type Task =
  | "hook"
  | "analyze"
  | "ideas"
  | "opportunity"
  | "competitor"
  | "insights"
  | "clusters"
  | "trends"
  | "daily"
  | "generic";

export interface ModelProfile {
  model: string;
  temperature: number;
  top_p: number;
  max_tokens: number;
  /** Provider-specific passthrough (e.g. DeepSeek's thinking toggle). */
  extraBody?: Record<string, unknown>;
}

/** Reasoning / analysis profile — lower temperature for reliable structured output. */
const reasoning = (): ModelProfile => ({
  model: DEEPSEEK,
  temperature: 0.6,
  top_p: 0.95,
  max_tokens: 8192,
  extraBody: { chat_template_kwargs: { thinking: false } },
});

/** Writing / voice profile — warmer sampling for more human-sounding copy. */
const writing = (): ModelProfile => ({
  model: WRITER,
  temperature: 0.9,
  top_p: 1,
  max_tokens: 8192,
});

const STRATEGY: Record<Task, ModelProfile> = {
  // Analytical / ideation work -> DeepSeek V4 Pro
  ideas: reasoning(),
  analyze: reasoning(),
  competitor: reasoning(),
  insights: reasoning(),
  clusters: reasoning(),
  trends: reasoning(),
  // Creative / voice work -> OpenAI gpt-oss-120b
  hook: writing(),
  opportunity: writing(),
  daily: writing(),
  generic: writing(),
};

export function selectModel(task?: string): ModelProfile {
  return STRATEGY[(task as Task) ?? "generic"] ?? STRATEGY.generic;
}
