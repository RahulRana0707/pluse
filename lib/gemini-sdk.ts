/**
 * Live Client Bridge for Google Gemini
 * Replaces the mock simulation with active calls to the server-side /api/gemini endpoint.
 * This sends instructions to the real Gemini model (gemini-2.0-flash) and handles both text and JSON payloads.
 */

export interface GeminiResponse {
  response: {
    text: () => string;
  };
}

export class GoogleGenAI {
  apiKey: string;

  constructor({ apiKey }: { apiKey: string }) {
    this.apiKey = apiKey;
  }

  getGenerativeModel({ model }: { model: string }) {
    return {
      generateContent: async (prompt: string): Promise<GeminiResponse> => {
        const lowerPrompt = prompt.toLowerCase();
        let systemInstruction = "";
        let formatJson = false;

        // Determine request type and assign appropriate System Instructions for the real model
        
        // 1. Hook Intelligence
        if (lowerPrompt.includes("hook:") || lowerPrompt.includes("score hook")) {
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
Ensure virality is a number between 1.0 and 10.0. Suggestions must contain 1-3 actionable checklist items.`;
          formatJson = true;
        }

        // 3. Idea Engine Generator
        else if (lowerPrompt.includes("generate ideas") || lowerPrompt.includes("niche:")) {
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

        // 4. Opportunity Feed Drafts
        else if (lowerPrompt.includes("opportunity drafts") || lowerPrompt.includes("opportunity:")) {
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

        // Make the POST request to our API endpoint
        const response = await fetch("/api/gemini", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt,
            systemInstruction: systemInstruction || undefined,
            formatJson,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to contact Gemini API");
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
