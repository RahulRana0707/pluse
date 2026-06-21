"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Flame,
  Sparkles,
  ArrowRight,
  Clock,
  Library,
  PenTool,
  RefreshCw,
  Zap,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

interface RecommendedAction {
  id: string;
  title: string;
  niche: string;
  actionLabel: string;
  url: string;
  reason: string;
  priority: "High" | "Medium";
}

export default function Page() {
  const [recommendations, setRecommendations] = useState<RecommendedAction[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  const fetchInsights = async (quiet = false) => {
    if (!quiet) setIsRefreshing(true);
    setConfigError(null);
    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "Generate exactly 3 daily recommended actions for a software/design content creator based on current trends. Return the result strictly as a JSON array.",
          systemInstruction: `You are an expert creator growth recommendations engine. Scan current attention trends and generate exactly 3 highly actionable recommendations.
Return the output strictly as a JSON array matching this schema:
[
  {
    "id": "rec-1",
    "title": "Action title...",
    "niche": "Software Engineering",
    "actionLabel": "Audit Competitor",
    "url": "/dashboard/intelligence?handle=@levelsio",
    "reason": "Why this action is valuable...",
    "priority": "High"
  }
]

Constraints:
1. Available Action URLs are:
   - /dashboard/opportunities?topic=... (recommend writing about trending topics)
   - /dashboard/intelligence?handle=... (recommend auditing active competitor handle)
   - /dashboard/hooks?hookText=... (recommend optimizing a hook)
   - /dashboard/ideas?audience=...&goal=... (recommend generating concepts for specific targets)
   - /dashboard/patterns?pattern=... (recommend using content patterns)
2. Niches must be from: 'Software Engineering', 'Design & UIUX', 'Marketing & Growth', 'Cryptocurrency & Web3'.
3. Priorities must be 'High' or 'Medium'.
4. Do not include markdown codeblocks (\`\`\`json) or text wrappers. Return only the raw JSON.`,
          formatJson: true,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        if (data.error && data.error.includes("GEMINI_API_KEY")) {
          setConfigError("GEMINI_API_KEY is not configured in your .env file.");
        } else {
          setConfigError(data.error || "Failed to load insights.");
        }
        return;
      }

      const data = await response.json();
      const parsed = JSON.parse(data.text.trim());
      setRecommendations(Array.isArray(parsed) ? parsed : []);
      if (!quiet) toast.success("AI insights desk refreshed!");
    } catch (e: any) {
      console.error(e);
      setConfigError("Gemini API returned invalid JSON. Press refresh to try again.");
    } finally {
      if (!quiet) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInsights(true);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Command Center</h2>
          <p className="text-sm text-muted-foreground">
            Welcome back, Creator. Here is the current standing of your audience optimization metrics.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => fetchInsights()}
          disabled={isRefreshing}
          className="active-scale gap-1.5 h-9 rounded-xl border border-border"
        >
          <RefreshCw className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          <span>Refresh Insights</span>
        </Button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Impressions Optimized</CardTitle>
            <LineChart className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">248.5K</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-emerald-500 font-semibold">+12.3%</span> vs last week
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Content Score</CardTitle>
            <Sparkles className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">9.1/10</div>
            <p className="text-xs text-muted-foreground mt-1">
              Top <span className="font-semibold text-foreground">5%</span> of ecosystem creators
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Ideas in OS</CardTitle>
            <Flame className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">7 Concepts</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="font-semibold text-foreground">2</span> drafts ready for review
            </p>
          </CardContent>
        </Card>
      </div>

      {/* AI Growth Insights Desk */}
      <Card className="border border-primary/20 bg-primary/5 dark:bg-primary/5/10">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <Zap className="size-4 text-primary fill-primary" />
              AI Growth Insights Desk
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Real-time actionable prompts generated by Gemini based on niche shifts.
            </CardDescription>
          </div>
          <Badge className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/10">
            Active Radar
          </Badge>
        </CardHeader>
        <CardContent>
          {configError ? (
            <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive flex items-center gap-3 text-xs">
              <AlertTriangle className="size-4 shrink-0" />
              <div>
                <p className="font-bold">Missing Gemini Key</p>
                <p className="mt-0.5 text-muted-foreground">
                  To load live insights, add <code className="font-mono text-foreground font-semibold">GEMINI_API_KEY=&quot;your_key&quot;</code> to your <code className="font-mono text-foreground font-semibold">.env</code> file.
                </p>
              </div>
            </div>
          ) : isRefreshing ? (
            <div className="grid gap-3 sm:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 rounded-2xl bg-card border border-border space-y-3">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-8 w-full mt-2 rounded-xl" />
                </div>
              ))}
            </div>
          ) : recommendations.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-3">
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="p-3.5 rounded-2xl bg-card border border-border flex flex-col justify-between gap-3 hover:border-primary/20 transition-all duration-150 shadow-sm"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant={rec.priority === "High" ? "default" : "secondary"} className="text-[10px] py-0 px-2 font-semibold">
                        {rec.priority} Priority
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase">{rec.niche}</span>
                    </div>
                    <p className="text-xs font-semibold text-foreground leading-relaxed">
                      {rec.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      {rec.reason}
                    </p>
                  </div>
                  <Link href={rec.url}>
                    <Button size="sm" className="w-full h-8 text-[11px] font-semibold gap-1 rounded-xl">
                      <span>{rec.actionLabel}</span>
                      <ArrowRight className="size-3" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
              <Sparkles className="size-5 text-muted-foreground/50" />
              <span>No active insights. Press Refresh to compile current metrics.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottom Layout split */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left/Center Column: Recent Activity */}
        <Card className="border border-border bg-card md:col-span-2 flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-base font-bold">Optimization Pipeline</CardTitle>
            <CardDescription>Recently drafted and optimized content templates.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-xl bg-muted/40 border border-border">
              <div className="flex items-center gap-3">
                <PenTool className="size-4 text-muted-foreground" />
                <div>
                  <h5 className="text-sm font-medium text-foreground">SaaS Landing Page Hooks</h5>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Clock className="size-3" /> 12 mins ago
                  </p>
                </div>
              </div>
              <span className="text-xs text-emerald-500 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">9.2/10</span>
            </div>

            <div className="flex justify-between items-center p-3 rounded-xl bg-muted/40 border border-border">
              <div className="flex items-center gap-3">
                <Library className="size-4 text-muted-foreground" />
                <div>
                  <h5 className="text-sm font-medium text-foreground">Designing interfaces that feel right</h5>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Clock className="size-3" /> 2 hours ago
                  </p>
                </div>
              </div>
              <span className="text-xs text-emerald-500 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">8.5/10</span>
            </div>

            <div className="flex justify-between items-center p-3 rounded-xl bg-muted/40 border border-border">
              <div className="flex items-center gap-3">
                <PenTool className="size-4 text-muted-foreground" />
                <div>
                  <h5 className="text-sm font-medium text-foreground">5 VS Code shortcuts you need</h5>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Clock className="size-3" /> Yesterday
                  </p>
                </div>
              </div>
              <span className="text-xs text-emerald-500 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">8.9/10</span>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Toolkit Shortcuts */}
        <Card className="border border-border bg-card flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-base font-bold">Quick Actions</CardTitle>
            <CardDescription>Direct shortcuts to creator optimization tools.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Link href="/dashboard/analyzer">
              <Button variant="outline" className="w-full justify-between active-scale h-10 rounded-xl">
                <span>Analyze Draft</span>
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link href="/dashboard/hooks">
              <Button variant="outline" className="w-full justify-between active-scale h-10 rounded-xl">
                <span>Score a Hook</span>
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link href="/dashboard/ideas">
              <Button variant="outline" className="w-full justify-between active-scale h-10 rounded-xl">
                <span>Generate New Ideas</span>
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link href="/dashboard/content-os">
              <Button className="w-full justify-between active-scale h-10 rounded-xl">
                <span>Open Content OS</span>
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
