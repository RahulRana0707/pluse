"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  TrendingUp,
  Users,
  Target,
  Zap,
  Search,
  Award,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { PulseAI } from "@/lib/ai-sdk";

interface CompetitorAnalysis {
  frequency: string;
  framework: string;
  hookStyle: string;
  critique: string;
  counterStrategy: string;
}

interface InterestCluster {
  topic: string;
  volume: string;
  speed: string;
  niche: string;
}

export default function Page() {
  const [handle, setHandle] = useState("");
  const [niche, setNiche] = useState("Software Engineering");
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<CompetitorAnalysis | null>(null);

  const [clusters, setClusters] = useState<InterestCluster[]>([]);
  const [isClustersLoading, setIsClustersLoading] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  const fetchClusters = async () => {
    setIsClustersLoading(true);
    setConfigError(null);
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: "clusters",
          prompt: "Generate 4 dynamic audience interest clusters. Return the output strictly as a JSON array.",
          systemInstruction: `You are an audience attention scanner. Renders exactly 4 interest clusters.
Return output strictly as a JSON array matching this exact schema:
[
  {
    "topic": "Topic details...",
    "volume": "High",
    "speed": "+110%",
    "niche": "Software Engineering"
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
          setConfigError("NVIDIA_API_KEY is not configured in .env file.");
        } else {
          setConfigError(errData.error || "Failed to load clusters.");
        }
        return;
      }

      const data = await response.json();
      const parsed = JSON.parse(data.text.trim());
      if (Array.isArray(parsed)) {
        setClusters(parsed);
      }
    } catch {
      setConfigError("The model returned invalid JSON format. Try refreshing the page.");
    } finally {
      setIsClustersLoading(false);
    }
  };

  useEffect(() => {
    fetchClusters();
  }, []);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle.trim()) {
      toast.error("Please enter a competitor handle");
      return;
    }

    setIsLoading(true);
    setAnalysis(null);

    try {
      const ai = new PulseAI({ apiKey: "live" });
      const model = ai.getGenerativeModel();
      
      const prompt = `Analyze competitor handle ${handle} in the niche of ${niche}.`;
      const response = await model.generateContent(prompt);
      
      const parsed = JSON.parse(response.response.text());
      setAnalysis(parsed);
      toast.success("Competitor strategy map updated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch competitor strategy details.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Intelligence Hub</h2>
        <p className="text-sm text-muted-foreground">
          Analyze competitor profiles and audit shifting audience attention patterns.
        </p>
      </div>

      {configError ? (
        <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive flex items-center gap-3 text-xs">
          <AlertTriangle className="size-4 shrink-0" />
          <div>
            <p className="font-bold">Missing NVIDIA Key</p>
            <p className="mt-0.5 text-muted-foreground">
              To use the Auditor Hub, add <code className="font-mono text-foreground font-semibold">NVIDIA_API_KEY=&quot;your_key&quot;</code> to your <code className="font-mono text-foreground font-semibold">.env</code> file.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Side: Competitor Audit Panel */}
            <Card className="border border-border bg-card lg:col-span-1 flex flex-col justify-between rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Target className="size-4 text-primary" />
                  Competitor Auditor
                </CardTitle>
                <CardDescription>Deconstruct top creator accounts in your focus niche.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleAnalyze} className="space-y-4">
                  <FieldGroup className="flex flex-col gap-4">
                    <Field>
                      <FieldLabel htmlFor="comp-handle" className="text-xs font-semibold text-muted-foreground mb-1">
                        Competitor Handle
                      </FieldLabel>
                      <input
                        id="comp-handle"
                        type="text"
                        placeholder="e.g. @levelsio"
                        value={handle}
                        onChange={(e) => setHandle(e.target.value)}
                        className="w-full bg-background border border-input rounded-xl px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary h-10"
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="comp-niche" className="text-xs font-semibold text-muted-foreground mb-1">
                        Niche Segment
                      </FieldLabel>
                      <Select value={niche} onValueChange={setNiche}>
                        <SelectTrigger id="comp-niche" className="w-full h-10 bg-background border border-input rounded-xl px-3 text-left">
                          <SelectValue placeholder="Select Niche" />
                        </SelectTrigger>
                        <SelectContent position="popper" className="w-full bg-popover text-popover-foreground">
                          <SelectItem value="Software Engineering">Software Engineering</SelectItem>
                          <SelectItem value="Design & UIUX">Design & UIUX</SelectItem>
                          <SelectItem value="Marketing & Growth">Marketing & Growth</SelectItem>
                          <SelectItem value="Cryptocurrency & Web3">Cryptocurrency & Web3</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </FieldGroup>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full active-scale h-10 font-semibold rounded-xl flex items-center justify-center gap-2 mt-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin size-4" />
                        Auditing Handle...
                      </>
                    ) : (
                      <>
                        <Search className="size-4" />
                        Audit Strategy
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Right Side: Competitor Strategy Report */}
            <Card className="border border-border bg-card lg:col-span-2 flex flex-col justify-between rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Award className="size-4 text-emerald-500" />
                  Auditor Report
                </CardTitle>
                <CardDescription>AI generated breakdown of competitor formats and countermeasures.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                {analysis ? (
                  <div className="flex flex-col gap-4 text-sm w-full">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="p-3 bg-muted/40 border border-border rounded-xl">
                        <span className="text-xs text-muted-foreground block font-medium">Posting Cadence</span>
                        <p className="font-semibold text-foreground mt-1">{analysis.frequency}</p>
                      </div>
                      <div className="p-3 bg-muted/40 border border-border rounded-xl">
                        <span className="text-xs text-muted-foreground block font-medium">Core Content Framework</span>
                        <p className="font-semibold text-foreground mt-1">{analysis.framework}</p>
                      </div>
                    </div>

                    <div className="p-3 bg-muted/40 border border-border rounded-xl">
                      <span className="text-xs text-muted-foreground block font-medium">Favorite Hook Formula</span>
                      <p className="font-mono text-xs text-primary mt-1 font-semibold">{analysis.hookStyle}</p>
                    </div>

                    <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl space-y-1">
                      <span className="text-xs text-amber-500 block font-bold uppercase tracking-wider">Vulnerabilities & gaps</span>
                      <p className="text-xs text-foreground leading-relaxed">{analysis.critique}</p>
                    </div>

                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl space-y-1">
                      <span className="text-xs text-emerald-500 block font-bold uppercase tracking-wider">Your Counter Strategy</span>
                      <p className="text-xs text-foreground leading-relaxed">{analysis.counterStrategy}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground text-xs gap-2">
                    <Zap className="size-6 text-muted-foreground/40" />
                    <span>Specify a competitor handle and press audit to scan hook metrics and weaknesses.</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Bottom Section: Shifting Audience Attention Trends */}
          <Card className="border border-border bg-card rounded-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Users className="size-4 text-amber-500" />
                    Audience Attention Clusters
                  </CardTitle>
                  <CardDescription>Visualized clusters showing dynamic attention and speed indices.</CardDescription>
                </div>
                <span className="text-xs font-semibold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full">
                  Live tracking
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {isClustersLoading ? (
                  [1, 2, 3, 4].map((i) => (
                    <div key={i} className="p-4 rounded-2xl bg-muted/40 border border-border space-y-3">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-4 w-32" />
                      <div className="flex justify-between mt-2 pt-2 border-t border-border">
                        <Skeleton className="h-3 w-12" />
                        <Skeleton className="h-4 w-8" />
                      </div>
                    </div>
                  ))
                ) : clusters.length > 0 ? (
                  clusters.map((cluster, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-muted/40 border border-border flex flex-col justify-between gap-3 hover:border-primary/30 transition-all duration-200"
                    >
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                          {cluster.niche}
                        </span>
                        <p className="text-sm font-semibold text-foreground mt-1 leading-relaxed">
                          {cluster.topic}
                        </p>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-border/60 text-xs">
                        <span className="text-muted-foreground">Volume: <strong className="text-foreground">{cluster.volume}</strong></span>
                        <span className="flex items-center gap-0.5 text-emerald-500 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                          <TrendingUp className="size-3" />
                          {cluster.speed}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-4 p-8 text-center text-xs text-muted-foreground">
                    Press refresh or reload to compile audience clusters.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
