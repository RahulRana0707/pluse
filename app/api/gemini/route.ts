import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: Request) {
  try {
    const { prompt, systemInstruction, formatJson } = await request.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured in the .env file. Please add your key to proceed." },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-lite",
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      ...(systemInstruction ? { systemInstruction } : {}),
      ...(formatJson ? { generationConfig: { responseMimeType: "application/json" } } : {}),
    });

    const responseText = result.response.text();
    return NextResponse.json({ text: responseText });
  } catch (error) {
    console.error("[Gemini Route] Error:", error);
    let message = "Failed to generate content from Google Gemini.";
    if (error instanceof Error) {
      // Surface Google's rejection clearly (bad key, quota exceeded, etc.)
      message = error.message;
      if (message.includes("API_KEY_INVALID") || message.includes("API key not valid")) {
        message = "The GEMINI_API_KEY in your .env file is invalid. Please replace it with a valid key from aistudio.google.com/apikey.";
      } else if (message.includes("429") || message.includes("quota") || message.includes("Too Many Requests")) {
        message = "Gemini API quota exceeded. Enable billing on your Google Cloud project at console.cloud.google.com/billing to continue.";
      }
    }
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
