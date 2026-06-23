import { NextResponse } from "next/server";
import OpenAI from "openai";
import { NVIDIA_BASE_URL, selectModel } from "@/lib/ai/models";

const MISSING_KEY = "NVIDIA_API_KEY is not configured in the .env file. Please add your key to proceed.";

export async function POST(request: Request) {
  try {
    const { prompt, systemInstruction, formatJson, task, stream } = await request.json();

    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: MISSING_KEY }, { status: 500 });
    }

    const profile = selectModel(task);
    const client = new OpenAI({ apiKey, baseURL: NVIDIA_BASE_URL });

    // The hosted models don't reliably honour response_format, so JSON shape is
    // enforced through the system prompt and the fences are stripped below.
    const system = formatJson
      ? `${systemInstruction ?? ""}\nRespond with raw JSON only. Do not wrap it in markdown code fences.`.trim()
      : systemInstruction;

    const params = {
      model: profile.model,
      temperature: profile.temperature,
      top_p: profile.top_p,
      max_tokens: profile.max_tokens,
      messages: [
        ...(system ? [{ role: "system" as const, content: system }] : []),
        { role: "user" as const, content: prompt },
      ],
      ...profile.extraBody,
    };

    // Stream plain-text deltas for long prose (e.g. the article body) so the UI
    // can render it live instead of waiting for the whole completion.
    if (stream) {
      const completion = await client.chat.completions.create({ ...params, stream: true });
      const encoder = new TextEncoder();
      const body = new ReadableStream<Uint8Array>({
        async start(controller) {
          try {
            for await (const chunk of completion) {
              const delta = chunk.choices[0]?.delta?.content;
              if (delta) controller.enqueue(encoder.encode(delta));
            }
          } catch (e) {
            controller.error(e);
          } finally {
            controller.close();
          }
        },
      });
      return new Response(body, {
        headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
      });
    }

    const completion = await client.chat.completions.create(params);
    const text = stripFences(completion.choices[0]?.message?.content ?? "");
    return NextResponse.json({ text, model: profile.model });
  } catch (error) {
    console.error("[AI Route] Error:", error);
    let message = "Failed to generate content from the NVIDIA model.";
    if (error instanceof Error) {
      message = error.message;
      if (error.message.includes("401") || error.message.toLowerCase().includes("unauthorized")) {
        message = "The NVIDIA_API_KEY in your .env file is invalid. Replace it with a valid key from build.nvidia.com.";
      } else if (error.message.includes("429")) {
        message = "NVIDIA API rate limit reached. Wait a moment and try again.";
      }
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Models occasionally wrap JSON in ```json fences despite instructions. */
function stripFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}
