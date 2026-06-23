"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  Sparkles,
  TrendingUp,
  Rss,
  Copy,
  LineChart,
  Layers,
  Check,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { PulseAI } from "@/lib/ai-sdk";
import { createDraft } from "@/lib/actions/drafts";
import { useProfile } from "@/components/profile-provider";
import { voicePromptBlock } from "@/lib/ai/voice";

interface Opportunity {
  id: string;
  topic: string;
  niche: string;
  growth: string;
  volume: string;
  source: string;
}

function OpportunitiesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { profile } = useProfile();
  const topicParam = searchParams.get("topic");

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [isFeedLoading, setIsFeedLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [aiReport, setAiReport] = useState<{
    analysis: string;
    drafts: { contrarian: string; educational: string; opinion: string; story: string };
  } | null>(null);
  
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [pushedType, setPushedType] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  const fetchTrendFeed = async (quiet = false) => {
    if (!quiet) setIsFeedLoading(true);
    setConfigError(null);
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: "trends",
          prompt: "Generate 5 trending content discussion topics for creators. Return the output strictly as a JSON array.",
          systemInstruction: `You are a real-time social signals scanner. Identify 5 hot discussion topics across niches.
Return the output strictly as a JSON array matching this exact schema:
[
  {
    "id": "opp-1",
    "topic": "Specific spiking topic description...",
    "niche": "Software Engineering",
    "growth": "+140%",
    "volume": "High",
    "source": "GitHub & X"
  }
]
Niches must be from: 'Software Engineering', 'Design & UIUX', 'Marketing & Growth', 'Cryptocurrency & Web3'.
Do not return codeblock markdown. Return only raw JSON.`,
          formatJson: true,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        if (errData.error && errData.error.includes("NVIDIA_API_KEY")) {
          setConfigError("NVIDIA_API_KEY is not configured in your .env file.");
        } else {
          setConfigError(errData.error || "Failed to load trend feed.");
        }
        return;
      }

      const data = await response.json();
      const parsed = JSON.parse(data.text.trim());
      if (Array.isArray(parsed) && parsed.length > 0) {
        setOpportunities(parsed);
        
        // Match topicParam if exists
        let initialSelection = parsed[0];
        if (topicParam) {
          const match = parsed.find(
            (o) => o.topic.toLowerCase().includes(topicParam.toLowerCase()) || 
                   topicParam.toLowerCase().includes(o.topic.toLowerCase())
          );
          if (match) initialSelection = match;
        }
        setSelectedOpp(initialSelection);
      }
      if (!quiet) toast.success("Trend feed updated!");
    } catch {
      setConfigError("The model returned invalid JSON. Try refreshing the feed.");
    } finally {
      if (!quiet) setIsFeedLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendFeed(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicParam]);

  // Load AI draft details whenever selection changes
  useEffect(() => {
    if (!selectedOpp) return;
    const fetchAIDrafts = async () => {
      setIsLoading(true);
      setAiReport(null);
      try {
        const ai = new PulseAI({ apiKey: "live" });
        const model = ai.getGenerativeModel();
        const prompt = `Generate opportunity drafts for topic: ${selectedOpp.topic}` + voicePromptBlock(profile);
        const response = await model.generateContent(prompt);
        
        const data = JSON.parse(response.response.text());
        setAiReport(data);
      } catch (e: any) {
        toast.error(e.message || "Failed to generate AI drafts for this topic.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAIDrafts();
  }, [selectedOpp]);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    toast.success(`${type} draft copied!`);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const pushToContentOS = async (text: string, type: string) => {
    if (!selectedOpp) return;
    try {
      await createDraft({
        title: text.length > 60 ? text.substring(0, 57) + "..." : text,
        body: text,
        niche: selectedOpp.niche,
        status: "Ideas",
        source: `opportunity:${type}`,
      });
      setPushedType(type);
      toast.success("Draft added to Content OS Ideas!");
      setTimeout(() => setPushedType(null), 2000);
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
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Opportunity Feed</h2>
          <p className="text-sm text-muted-foreground">
            Discover trending topics and discussions before they reach mainstream lists.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => fetchTrendFeed()}
          disabled={isFeedLoading}
          className="active-scale gap-1.5 h-9 rounded-xl border border-border"
        >
          <RefreshCw className={`size-3.5 ${isFeedLoading ? "animate-spin" : ""}`} />
          <span>Refresh Feed</span>
        </Button>
      </div>

      {configError ? (
        <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive flex items-center gap-3 text-xs">
          <AlertTriangle className="size-4 shrink-0" />
          <div>
            <p className="font-bold">Missing NVIDIA Key</p>
            <p className="mt-0.5 text-muted-foreground">
              To load active trends, add <code className="font-mono text-foreground font-semibold">NVIDIA_API_KEY=&quot;your_key&quot;</code> to your <code className="font-mono text-foreground font-semibold">.env</code> file.
            </p>
          </div>
        </div>
      ) : (
        /* Main Layout Split */
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column: Opportunity list */}
          <div className="lg:col-span-1 flex flex-col gap-3">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Trending Creator Signals ({opportunities.length})
            </span>
            <div className="flex flex-col gap-2">
              {isFeedLoading ? (
                [1, 2, 3].map((i) => (
                  <div key={i} className="p-4 rounded-2xl border border-border space-y-3 bg-card">
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))
              ) : opportunities.length > 0 ? (
                opportunities.map((opp) => {
                  const isSelected = selectedOpp?.id === opp.id;
                  return (
                    <div
                      key={opp.id}
                      onClick={() => setSelectedOpp(opp)}
                      className={`p-4 rounded-2xl border text-left cursor-pointer transition-all duration-150 flex flex-col gap-2 ${
                        isSelected
                          ? "bg-primary/5 border-primary/40 shadow-sm"
                          : "bg-card border-border hover:border-border/80 hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                          {opp.niche}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">{opp.source}</span>
                      </div>
                      <h4 className="text-sm font-semibold text-foreground leading-snug">
                        {opp.topic}
                      </h4>
                      <div className="flex items-center justify-between mt-1 text-[11px]">
                        <span className="text-muted-foreground">Volume: <strong className="text-foreground">{opp.volume}</strong></span>
                        <span className="flex items-center gap-0.5 text-emerald-500 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                          <TrendingUp className="size-3" />
                          {opp.growth}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  No topics compiled. Press refresh to search social channels.
                </div>
              )}
            </div>
          </div>

          {/* Right column: AI Strategy & Drafting Workbench */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              AI Strategy & Drafting Workbench
            </span>
            
            <Card className="border border-border bg-card flex-1 flex flex-col justify-between rounded-2xl">
              {selectedOpp ? (
                <>
                  <CardHeader className="border-b border-border pb-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Rss className="size-4 text-primary" />
                        <CardTitle className="text-base font-bold text-foreground">
                          {selectedOpp.topic}
                        </CardTitle>
                      </div>
                      <CardDescription>
                        Analyzing signal data from {selectedOpp.source} • Growth speed {selectedOpp.growth}
                      </CardDescription>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-4 flex-1 flex flex-col gap-4">
                    {isLoading ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-12 text-muted-foreground text-xs gap-2">
                        <Loader2 className="animate-spin size-6 text-primary" />
                        <span>Pulse is compiling topic signals and drafting templates...</span>
                      </div>
                    ) : aiReport ? (
                      <div className="space-y-4 flex-1 flex flex-col">
                        {/* AI Trend Analysis */}
                        <div className="p-3 bg-muted/40 border border-border rounded-xl">
                          <span className="text-[10px] font-bold text-primary uppercase block tracking-wider mb-1">
                            AI Trend Insights
                          </span>
                          <p className="text-xs text-foreground leading-relaxed">
                            {aiReport.analysis}
                          </p>
                        </div>

                        {/* AI Draft Tabs */}
                        <div className="flex-1 flex flex-col gap-3">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                            AI-Generated Angle Drafts
                          </span>
                          
                          <Tabs defaultValue="contrarian" className="flex-1 flex flex-col">
                            <TabsList className="grid grid-cols-4 bg-muted/50 p-1 rounded-xl h-9">
                              <TabsTrigger value="contrarian" className="text-xs rounded-lg py-1">Contrarian</TabsTrigger>
                              <TabsTrigger value="educational" className="text-xs rounded-lg py-1">Educational</TabsTrigger>
                              <TabsTrigger value="opinion" className="text-xs rounded-lg py-1">Opinion</TabsTrigger>
                              <TabsTrigger value="story" className="text-xs rounded-lg py-1">Story</TabsTrigger>
                            </TabsList>

                            {Object.entries(aiReport.drafts).map(([type, text]) => (
                              <TabsContent key={type} value={type} className="flex-1 flex flex-col justify-between mt-3 gap-4">
                                <div className="p-4 rounded-xl border border-border bg-background font-mono text-xs text-foreground whitespace-pre-wrap leading-relaxed min-h-[120px] flex-1">
                                  {text}
                                </div>
                                
                                <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-3">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => copyToClipboard(text, type)}
                                    className="active-scale text-xs gap-1.5 h-8 px-3 rounded-lg"
                                  >
                                    {copiedType === type ? (
                                      <>
                                        <Check className="size-3.5 text-emerald-500" />
                                        <span>Copied</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="size-3.5" />
                                        <span>Copy Draft</span>
                                      </>
                                    )}
                                  </Button>
                                  
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => sendToAnalyzer(text)}
                                    className="active-scale text-xs gap-1.5 h-8 px-3 rounded-lg"
                                  >
                                    <LineChart className="size-3.5 text-muted-foreground" />
                                    <span>Analyze Copy</span>
                                  </Button>

                                  <Button
                                    size="sm"
                                    onClick={() => pushToContentOS(text, type)}
                                    className="active-scale text-xs gap-1.5 h-8 px-3 rounded-lg"
                                  >
                                    {pushedType === type ? (
                                      <>
                                        <Check className="size-3.5 text-emerald-500" />
                                        <span>Added!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Layers className="size-3.5" />
                                        <span>Send to OS</span>
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </TabsContent>
                            ))}
                          </Tabs>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center p-12 text-muted-foreground text-xs gap-1.5">
                        <Sparkles className="size-6 text-muted-foreground/40" />
                        <span>Select an opportunity from the feed to load AI strategies and drafting variants.</span>
                      </div>
                    )}
                  </CardContent>
                </>
              ) : (
                <div className="p-8 text-center text-xs text-muted-foreground flex flex-col items-center justify-center min-h-[300px] gap-2">
                  <Sparkles className="size-6 text-muted-foreground/40" />
                  <span>No opportunity selected. Select a signal cluster to analyze topic angles.</span>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Opportunity Feed</h2>
          <p className="text-sm text-muted-foreground">Discover trending topics and discussions.</p>
        </div>
        <div className="flex-1 flex items-center justify-center min-h-[400px] text-xs text-muted-foreground">
          <Loader2 className="animate-spin size-6 text-primary mr-2" />
          Loading Feed...
        </div>
      </div>
    }>
      <OpportunitiesContent />
    </Suspense>
  );
}
