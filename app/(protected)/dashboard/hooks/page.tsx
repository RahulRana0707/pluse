"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Sparkles,
  HelpCircle,
  Check,
  Copy,
  LineChart,
  Layers,
  Flame,
} from "lucide-react";
import { toast } from "sonner";
import { GoogleGenAI } from "@/lib/gemini-sdk";

interface HookMetrics {
  curiosity: number;
  retention: number;
  engagement: number;
  averageScore: number;
  critique: string;
  variants: { style: string; text: string }[];
}

function HooksContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const hookParam = searchParams.get("hookText");

  const [hookText, setHookText] = useState(() => {
    const param = searchParams.get("hookText");
    return param ? decodeURIComponent(param) : "";
  });
  const [isLoading, setIsLoading] = useState(false);
  const [metrics, setMetrics] = useState<HookMetrics | null>(null);
  
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [pushedIndex, setPushedIndex] = useState<number | null>(null);

  // Score hook wrapper
  const handleScoreHook = async (inputVal?: string) => {
    const textToScore = inputVal || hookText;
    if (!textToScore.trim()) {
      toast.error("Please enter a hook to score");
      return;
    }

    setIsLoading(true);
    setMetrics(null);

    try {
      const ai = new GoogleGenAI({ apiKey: "virtual-key" });
      const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });
      const prompt = `Score hook: ${textToScore}`;
      
      const response = await model.generateContent(prompt);
      const data = JSON.parse(response.response.text());
      
      setMetrics(data);
      toast.success("Hook scored successfully!");
    } catch {
      toast.error("Failed to evaluate hook scores.");
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger evaluation if query parameter is present on mount
  useEffect(() => {
    if (hookParam) {
      const decoded = decodeURIComponent(hookParam);
      handleScoreHook(decoded);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hookParam]);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success("Hook variant copied!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const pushToContentOS = (text: string, index: number) => {
    try {
      const stored = localStorage.getItem("pulse_kanban_cards");
      const cards = stored ? JSON.parse(stored) : [];
      const newCard = {
        id: `card-${Date.now()}-hook-${index}`,
        title: text,
        niche: "Marketing & Growth",
        status: "Ideas",
      };
      localStorage.setItem("pulse_kanban_cards", JSON.stringify([...cards, newCard]));
      setPushedIndex(index);
      toast.success("Variant added to Content OS Ideas!");
      setTimeout(() => setPushedIndex(null), 2000);
    } catch {
      toast.error("Failed to save to Content OS");
    }
  };

  const sendToAnalyzer = (text: string) => {
    const encoded = encodeURIComponent(text);
    router.push(`/dashboard/analyzer?draft=${encoded}`);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Hook Intelligence</h2>
        <p className="text-sm text-muted-foreground">
          The first sentence determines retention. Analyze and score your hooks before publishing.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Box: Editor */}
        <Card className="border border-border bg-card flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Flame className="size-4 text-primary" />
              Analyze Hook
            </CardTitle>
            <CardDescription>Type your hook sentence and check retention scores.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea
              placeholder="e.g., How to design clean dashboard interfaces without hardcoding colors..."
              rows={4}
              value={hookText}
              onChange={(e) => setHookText(e.target.value)}
              disabled={isLoading}
              className="w-full bg-background border border-input rounded-xl p-3.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[100px] leading-relaxed"
            />
            <Button
              onClick={() => handleScoreHook()}
              disabled={isLoading}
              className="active-scale h-10 w-full font-semibold rounded-xl transition-all duration-150 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin size-4" />
                  Calculating scores...
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  Score Hook
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Right Box: Metrics & Suggestions */}
        <Card className="border border-border bg-card flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-base font-bold">Metrics Breakdown</CardTitle>
            <CardDescription>Curiosity index and expected scroll-stop retention levels.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between gap-5">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-muted/30 border border-border rounded-xl text-center">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase">Curiosity</span>
                <p className="text-xl font-bold text-foreground mt-1">
                  {metrics ? `${metrics.curiosity}/10` : "--/10"}
                </p>
              </div>
              <div className="p-3 bg-muted/30 border border-border rounded-xl text-center">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase">Retention</span>
                <p className="text-xl font-bold text-foreground mt-1">
                  {metrics ? `${metrics.retention}/10` : "--/10"}
                </p>
              </div>
              <div className="p-3 bg-muted/30 border border-border rounded-xl text-center">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase">Engagement</span>
                <p className="text-xl font-bold text-foreground mt-1">
                  {metrics ? `${metrics.engagement}/10` : "--/10"}
                </p>
              </div>
            </div>

            {/* Critique Callout */}
            {metrics && (
              <div className="p-3.5 rounded-xl border border-primary/10 bg-primary/5 text-xs text-foreground leading-relaxed">
                <strong className="text-primary font-bold block mb-1">AI Critique:</strong>
                {metrics.critique}
              </div>
            )}

            <div className="rounded-xl bg-muted/20 border border-border p-4 flex-1 min-h-[160px] flex flex-col gap-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Hook Variants Generator
              </span>
              {metrics ? (
                <div className="flex flex-col gap-3">
                  {metrics.variants.map((option, idx) => (
                    <div key={idx} className="flex flex-col justify-between gap-3 p-3 rounded-xl bg-card border border-border text-xs">
                      <div className="space-y-1">
                        <Badge variant="outline" className="text-[9px] font-bold px-1.5 py-0">
                          {option.style}
                        </Badge>
                        <p className="text-foreground leading-relaxed font-mono pt-1">{option.text}</p>
                      </div>
                      <div className="flex items-center justify-end gap-2 border-t border-border/60 pt-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2.5 text-[10px] gap-1"
                          onClick={() => copyToClipboard(option.text, idx)}
                        >
                          {copiedIndex === idx ? (
                            <>
                              <Check className="size-3 text-emerald-500" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="size-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2.5 text-[10px] gap-1"
                          onClick={() => sendToAnalyzer(option.text)}
                        >
                          <LineChart className="size-3 text-muted-foreground" />
                          <span>Analyze</span>
                        </Button>
                        <Button
                          size="sm"
                          className="h-7 px-2.5 text-[10px] gap-1"
                          onClick={() => pushToContentOS(option.text, idx)}
                        >
                          {pushedIndex === idx ? (
                            <>
                              <Check className="size-3 text-emerald-500" />
                              <span>Added!</span>
                            </>
                          ) : (
                            <>
                              <Layers className="size-3" />
                              <span>Send to OS</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-xs text-muted-foreground gap-1.5 p-4">
                  <HelpCircle className="size-5 text-muted-foreground/60" />
                  <span>Provide a hook to generate curiosity, readability, and scroll-stop metrics.</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Hook Intelligence</h2>
          <p className="text-sm text-muted-foreground">The first sentence determines everything.</p>
        </div>
        <div className="flex-1 flex items-center justify-center min-h-[400px] text-xs text-muted-foreground">
          <Loader2 className="animate-spin size-6 text-primary mr-2" />
          Loading Analyzer...
        </div>
      </div>
    }>
      <HooksContent />
    </Suspense>
  );
}
