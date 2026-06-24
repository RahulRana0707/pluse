/**
 * Client bridge for Pulse's NVIDIA-hosted models.
 * Classifies the prompt into a task, attaches the matching JSON system
 * instruction, and forwards it to /api/ai. The server (lib/ai/models.ts)
 * owns which model — DeepSeek V4 Pro or OpenAI gpt-oss-120b — actually runs each task.
 */

import type { Task } from "@/lib/ai/models";

export interface AIResponse {
  response: {
    text: () => string;
  };
}

export class PulseAI {
  apiKey: string;

  constructor({ apiKey }: { apiKey: string }) {
    this.apiKey = apiKey;
  }

  getGenerativeModel(_options: { model?: string } = {}) {
    return {
      generateContent: async (prompt: string): Promise<AIResponse> => {
        const lowerPrompt = prompt.toLowerCase();
        let systemInstruction = "";
        let formatJson = false;
        let task: Task = "generic";

        // 1. Hook Intelligence
        if (lowerPrompt.includes("hook:") || lowerPrompt.includes("score hook")) {
          task = "hook";
          systemInstruction = `You are a viral social media hook optimizer. Analyze the hook provided and return a JSON object with this exact schema:
{
  "curiosity": 7.5,
  "retention": 8.0,
  "engagement": 7.2,
  "averageScore": 7.6,
  "critique": "A brief, 2-sentence feedback explaining how to improve the hook.",
  "variants": [
    { "style": "The Curiosity Loop", "text": "Hook text..." },
    { "style": "The Contrarian Angle", "text": "Hook text..." },
    { "style": "The Warning Alert", "text": "Hook text..." },
    { "style": "The Data-Backed Hook", "text": "Hook text..." },
    { "style": "The Story Loop", "text": "Hook text..." }
  ]
}
Make sure all metrics are float numbers between 1.0 and 10.0. Average score must be the average of curiosity, retention, and engagement.`;
          formatJson = true;
        }

        // 2. Tweet / Draft Performance Analyzer
        else if (lowerPrompt.includes("analyze draft") || lowerPrompt.includes("virality score")) {
          task = "analyze";
          systemInstruction = `You are an attention optimization model. Analyze the social media draft copy provided and return a JSON object with this exact schema:
{
  "virality": 8.2,
  "readability": "Grade 8 (Optimal for social feed)",
  "clarity": "Punchy & Clean",
  "predictedImpressions": "15k - 45k",
  "predictedEngagement": "5.4%",
  "suggestions": [
    "Tip 1...",
    "Tip 2..."
  ],
  "rewrites": [
    { "style": "Punchy & Minimalist", "text": "Draft content..." },
    { "style": "Story-Driven Hook", "text": "Draft content..." },
    { "style": "Analytical / Data-Focused", "text": "Draft content..." }
  ]
}
Ensure virality is a number between 1.0 and 10.0. Suggestions must contain 1-3 actionable checklist items. Each rewrite must be a complete, ready-to-post version of the draft that applies the suggestions.`;
          formatJson = true;
        }

        // 3. Idea Engine Generator
        else if (lowerPrompt.includes("generate ideas") || lowerPrompt.includes("niche:")) {
          task = "ideas";
          systemInstruction = `You are a high-engagement content concept generator. Generate exactly 5 creative concepts/hooks based on the target niche, audience, and goal. Return a JSON object with this exact schema:
{
  "concepts": [
    {
      "id": "c-ai-1",
      "title": "Title hook sentence...",
      "description": "Short description...",
      "trigger": "FOMO / Social Proof / Curiosity",
      "structure": "Hook -> Lesson -> CTA"
    }
  ]
}
Generate exactly 5 concepts. Make sure the 'concepts' array has 5 objects.`;
          formatJson = true;
        }

        // 3b. Daily Personalized Post Generator
        else if (lowerPrompt.includes("generate daily posts")) {
          task = "daily";
          systemInstruction = `You are a personal content strategist for an X (Twitter) creator. Using the creator's profile, their previously published posts (their voice and proof), and tweets that inspire them, generate EXACTLY 10 original, ready-to-post tweets tailored to them. Return a JSON object with this exact schema:
{
  "posts": [
    {
      "id": "p-1",
      "text": "The full ready-to-post tweet...",
      "angle": "Contrarian",
      "pillar": "Which of the creator's content pillars this serves",
      "virality": 8.4
    }
  ]
}
Rules:
- Exactly 10 posts in the "posts" array.
- Each "text" is a complete, polished tweet written in the creator's voice and tone — no placeholders, no hashtags, ready to publish as-is.
- Align each post with the creator's pillars, audience, and goal. Vary the angles (e.g. Contrarian, Educational, Story, Listicle, Hot take, Question).
- "virality" is a float between 1.0 and 10.0 predicting how well the post could perform; be honest and use a varied range.
- Write in clear, natural English only. Never output other languages.`;
          formatJson = true;
        }

        // 4. Opportunity Feed Drafts
        else if (lowerPrompt.includes("opportunity drafts") || lowerPrompt.includes("opportunity:")) {
          task = "opportunity";
          systemInstruction = `You are a trend-analysis content drafting model. Based on the trending topic, write a 2-sentence signal analysis, and provide 4 drafts (contrarian, educational, opinion, story). Return a JSON object with this exact schema:
{
  "analysis": "Short analysis of why this topic is trending right now...",
  "drafts": {
    "contrarian": "Draft...",
    "educational": "Draft...",
    "opinion": "Draft...",
    "story": "Draft..."
  }
}`;
          formatJson = true;
        }

        // 5. Competitor Strategy Audit
        else if (lowerPrompt.includes("competitor handle") || lowerPrompt.includes("audit competitor")) {
          task = "competitor";
          systemInstruction = `You are a competitive social analyst. Analyze the creator handle in their niche and return a JSON object with this exact schema:
{
  "frequency": "Posting frequency details...",
  "framework": "Core layout framework description...",
  "hookStyle": "Hook style examples...",
  "critique": "A brief analysis of their formatting weaknesses...",
  "counterStrategy": "Recommended counter strategy to capture their attention share..."
}`;
          formatJson = true;
        }

        const response = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            task,
            systemInstruction: systemInstruction || undefined,
            formatJson,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to contact the NVIDIA model API");
        }

        const data = await response.json();
        return {
          response: {
            text: () => data.text,
          },
        };
      },
    };
  }
}
