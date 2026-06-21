"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  TrendingUp,
  Copy,
  Layers,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { GoogleGenAI } from "@/lib/gemini-sdk";

interface AnalysisResult {
  virality: number;
  readability: string;
  clarity: string;
  predictedImpressions: string;
  predictedEngagement: string;
  suggestions: string[];
  rewrites: { style: string; text: string }[];
}

function AnalyzerContent() {
  const searchParams = useSearchParams();
  const draftParam = searchParams.get("draft");

  const [draft, setDraft] = useState(() => {
    const param = searchParams.get("draft");
    return param ? decodeURIComponent(param) : "";
  });
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [pushedIdx, setPushedIdx] = useState<number | null>(null);

  const runAnalysis = async (inputVal?: string) => {
    const textToAnalyze = inputVal || draft;
    if (!textToAnalyze.trim()) {
      toast.error("Please paste or type a draft first");
      return;
    }

    setIsLoading(true);
    setResults(null);

    try {
      const ai = new GoogleGenAI({ apiKey: "virtual-key" });
      const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });
      const prompt = `Analyze draft copy: ${textToAnalyze}`;
      
      const response = await model.generateContent(prompt);
      const data = JSON.parse(response.response.text());
      
      setResults(data);
      toast.success("Performance analysis complete!");
    } catch {
      toast.error("Failed to analyze draft.");
    } finally {
      setIsLoading(false);
    }
  };

  // Run auto-analysis if query parameter exists on mount
  useEffect(() => {
    if (draftParam) {
      const decoded = decodeURIComponent(draftParam);
      runAnalysis(decoded);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftParam]);

  const copyRewrite = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    toast.success("Optimized draft copied!");
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const pushRewriteToOS = (text: string, idx: number) => {
    try {
      const stored = localStorage.getItem("pulse_kanban_cards");
      const cards = stored ? JSON.parse(stored) : [];
      const newCard = {
        id: `card-${Date.now()}-rewrite-${idx}`,
        title: text.length > 70 ? text.substring(0, 67) + "..." : text,
        niche: "Marketing & Growth",
        status: "Ideas",
      };
      localStorage.setItem("pulse_kanban_cards", JSON.stringify([...cards, newCard]));
      setPushedIdx(idx);
      toast.success("Optimized draft sent to Content OS Ideas!");
      setTimeout(() => setPushedIdx(null), 2000);
    } catch {
      toast.error("Failed to send draft to Content OS");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Tweet Analyzer</h2>
        <p className="text-sm text-muted-foreground">
          Analyze copy structure, sentiment alignment, and formatting before publishing to maximize impressions.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Card: Input Form */}
        <Card className="border border-border bg-card flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-base font-bold">Input Draft</CardTitle>
            <CardDescription>Enter the text you intend to publish.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea
              placeholder="Paste your drafted thread or post here..."
              rows={8}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={isLoading}
              className="w-full bg-background border border-input rounded-xl p-3.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[180px] leading-relaxed"
            />
            <Button
              onClick={() => runAnalysis()}
              disabled={isLoading}
              className="active-scale h-10 w-full font-semibold rounded-xl transition-all duration-150 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin size-4" />
                  Analyzing draft...
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  Run Performance Analysis
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Right Card: Results Panel */}
        <Card className="border border-border bg-card flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-base font-bold">Structure Analytics</CardTitle>
            <CardDescription>Metrics are generated dynamically based on copy formatting.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center text-sm py-2 border-b border-border">
                <span className="text-muted-foreground">Virality Index</span>
                <span className="font-bold text-foreground">
                  {results ? `${results.virality}/10` : "--/10"}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm py-2 border-b border-border">
                <span className="text-muted-foreground">Readability Level</span>
                <span className="font-bold text-foreground">
                  {results ? results.readability : "--"}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm py-2 border-b border-border">
                <span className="text-muted-foreground">Clarity & Brevity</span>
                <span className="font-bold text-foreground">
                  {results ? results.clarity : "--"}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm py-2 border-b border-border">
                <span className="text-muted-foreground">Predicted Impressions</span>
                <span className="font-bold text-emerald-500 flex items-center gap-1">
                  <TrendingUp className="size-3.5" />
                  {results ? results.predictedImpressions : "--"}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm py-2">
                <span className="text-muted-foreground">Expected Engagement Rate</span>
                <span className="font-bold text-foreground">
                  {results ? results.predictedEngagement : "--"}
                </span>
              </div>
            </div>

            {/* Critique / Suggestions Checklist */}
            <div className="rounded-xl bg-muted/30 border border-border p-4 flex-1 min-h-[140px] flex flex-col gap-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Improvement Checklist
              </span>
              {results ? (
                <div className="flex flex-col gap-2.5">
                  {results.suggestions.map((tip, idx) => (
                    <div key={idx} className="flex gap-2.5 text-xs text-foreground leading-relaxed align-top">
                      {results.virality >= 8.5 && results.suggestions.length === 1 ? (
                        <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />
                      )}
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-xs text-muted-foreground gap-1.5 p-4">
                  <HelpCircle className="size-5 text-muted-foreground/60" />
                  <span>Detailed suggestions and formatting metrics will appear here after analysis.</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Optimized Alternative Rewrites */}
      {results && (
        <Card className="border border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles className="size-4 text-primary fill-primary" />
              AI Optimized Rewrites
            </CardTitle>
            <CardDescription>Alternative formats modeled on high-performance frameworks.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {results.rewrites.map((rewrite, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-muted/30 border border-border flex flex-col justify-between gap-3 hover:border-primary/25 transition-all duration-150"
                >
                  <div className="space-y-2">
                    <Badge variant="secondary" className="text-[9px] font-bold px-1.5 py-0">
                      {rewrite.style}
                    </Badge>
                    <p className="text-xs font-mono text-foreground leading-relaxed whitespace-pre-wrap">
                      {rewrite.text}
                    </p>
                  </div>
                  <div className="flex items-center justify-end gap-2 border-t border-border/60 pt-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyRewrite(rewrite.text, idx)}
                      className="h-7 px-2.5 text-[10px] gap-1"
                    >
                      {copiedIdx === idx ? (
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
                      onClick={() => pushRewriteToOS(rewrite.text, idx)}
                      className="h-7 px-2.5 text-[10px] gap-1"
                    >
                      {pushedIdx === idx ? (
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Tweet Analyzer</h2>
          <p className="text-sm text-muted-foreground">Analyze copy structure and formatting.</p>
        </div>
        <div className="flex-1 flex items-center justify-center min-h-[400px] text-xs text-muted-foreground">
          <Loader2 className="animate-spin size-6 text-primary mr-2" />
          Loading Analyzer...
        </div>
      </div>
    }>
      <AnalyzerContent />
    </Suspense>
  );
}
