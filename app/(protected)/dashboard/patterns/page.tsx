"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Sparkles,
  Library,
  Copy,
  LineChart,
  Layers,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { PulseAI } from "@/lib/ai-sdk";
import { createDraft } from "@/lib/actions/drafts";

interface Pattern {
  id: string;
  name: string;
  category: "Framework" | "Contrarian" | "Story" | "Lessons";
  description: string;
  virality: string;
  score: string;
  structure: string;
  example: string;
}

const PATTERNS: Pattern[] = [
  {
    id: "pat-1",
    name: "Build-in-Public Loop",
    category: "Framework",
    description: "State a problem, show the raw solution, explain the core lessons, and end with an open question.",
    virality: "High",
    score: "9.2/10",
    structure: "Hook statement (problem) -> Initial struggles -> Visual progress/numbers -> Lessons learned -> Discussion prompt",
    example: "I wanted a better dashboard. Most mockups look generic. So I spent 12 hours coding dynamic HSL themes. Here's what I learned..."
  },
  {
    id: "pat-2",
    name: "Why X is Wrong Hook",
    category: "Contrarian",
    description: "Deconstruct popular industry advice with data-backed counterpoints to spark viral engagement.",
    virality: "Extreme",
    score: "9.5/10",
    structure: "Contrarian hook debunking myth -> Explaining the hidden cost -> Providing alternative data -> Real metric proof -> CTA",
    example: "Everyone tells you to write 5 drafts a day. But they ignore the quality drop. Here is why writing 1 detailed post converts 5x better:"
  },
  {
    id: "pat-3",
    name: "From $0 to $1M Narrative",
    category: "Story",
    description: "High-stakes journey showing key milestones, catastrophic failures, and raw operational numbers.",
    virality: "Very High",
    score: "8.9/10",
    structure: "Hook with milestone numbers -> The breakdown failure point -> The turnaround insight -> 3 actionable takeaways -> CTA",
    example: "6 months ago, my SaaS database crashed. We lost 40% of our metrics. Yesterday, we crossed $100k MRR. Here is the comeback blueprint:"
  },
  {
    id: "pat-4",
    name: "Hard Mistakes List",
    category: "Lessons",
    description: "Humbling analysis of costly mistakes that saves the reader time and gains immediate bookmarks.",
    virality: "High",
    score: "9.1/10",
    structure: "Hook (warning about mistakes) -> Mistake 1 (cost/lesson) -> Mistake 2 -> Mistake 3 -> High-value conclusion",
    example: "I wasted $15,000 on ads. Here are the 3 mistakes I made (so you don't have to): 1. Target general keywords..."
  }
];

function PatternsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const patternParam = searchParams.get("pattern");

  const [selectedPattern, setSelectedPattern] = useState<Pattern>(() => {
    const param = searchParams.get("pattern");
    if (param) {
      const match = PATTERNS.find(
        (p) => p.name.toLowerCase().includes(param.toLowerCase()) || 
               param.toLowerCase().includes(p.name.toLowerCase())
      );
      if (match) return match;
    }
    return PATTERNS[0];
  });
  const [niche, setNiche] = useState("Software Engineering");
  const [topic, setTopic] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState<string | null>(null);
  
  const [isCopied, setIsCopied] = useState(false);
  const [isPushed, setIsPushed] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      toast.error("Please enter a topic to customize the pattern");
      return;
    }

    setIsLoading(true);
    setGeneratedDraft(null);

    try {
      const ai = new PulseAI({ apiKey: "virtual-key" });
      const model = ai.getGenerativeModel();
      const prompt = `Generate pattern draft for pattern name: ${selectedPattern.name}, topic: ${topic}, niche: ${niche}`;
      
      const response = await model.generateContent(prompt);
      setGeneratedDraft(response.response.text());
      toast.success("Draft created using content pattern!");
    } catch {
      toast.error("Failed to generate draft.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!generatedDraft) return;
    navigator.clipboard.writeText(generatedDraft);
    setIsCopied(true);
    toast.success("Pattern draft copied!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const pushToContentOS = async () => {
    if (!generatedDraft) return;
    try {
      await createDraft({
        title: generatedDraft.length > 70 ? generatedDraft.substring(0, 67) + "..." : generatedDraft,
        body: generatedDraft,
        niche,
        status: "Ideas",
        source: "patterns",
      });
      setIsPushed(true);
      toast.success("Draft added to Content OS Ideas!");
      setTimeout(() => setIsPushed(false), 2000);
    } catch {
      toast.error("Failed to save to Content OS");
    }
  };

  const sendToAnalyzer = () => {
    if (!generatedDraft) return;
    const encoded = encodeURIComponent(generatedDraft);
    router.push(`/dashboard/analyzer?draft=${encoded}`);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Pattern Library</h2>
        <p className="text-sm text-muted-foreground">
          Database of proven content frameworks, contrarian angles, and high-retention lessons.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: Patterns grid list */}
        <div className="lg:col-span-1 flex flex-col gap-3">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Framework Library ({PATTERNS.length})
          </span>
          <div className="flex flex-col gap-2.5">
            {PATTERNS.map((pat) => {
              const isSelected = selectedPattern.id === pat.id;
              return (
                <div
                  key={pat.id}
                  onClick={() => {
                    setSelectedPattern(pat);
                    setGeneratedDraft(null);
                  }}
                  className={`p-4 rounded-2xl border text-left cursor-pointer transition-all duration-150 flex flex-col gap-2 ${
                    isSelected
                      ? "bg-primary/5 border-primary/40 shadow-sm"
                      : "bg-card border-border hover:border-border/80 hover:bg-muted/30"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-semibold">
                      {pat.category}
                    </Badge>
                    <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      {pat.score}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-foreground leading-snug">
                    {pat.name}
                  </h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                    {pat.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column: AI Custom Draft Generator */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            AI Custom Draft Builder
          </span>

          <Card className="border border-border bg-card flex-1 flex flex-col justify-between">
            <CardHeader className="border-b border-border pb-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <Library className="size-4 text-primary" />
                  <CardTitle className="text-base font-bold text-foreground">
                    {selectedPattern.name} Teardown
                  </CardTitle>
                </div>
                <div className="text-xs space-y-1.5 text-muted-foreground">
                  <p><strong>Structure:</strong> {selectedPattern.structure}</p>
                  <p><strong>Example:</strong> <code className="text-foreground font-mono">{selectedPattern.example}</code></p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-4 flex-1 flex flex-col gap-4">
              <form onSubmit={handleGenerate} className="space-y-4">
                <FieldGroup className="grid sm:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="niche-select" className="text-xs font-semibold text-muted-foreground mb-1">
                      Niche Target
                    </FieldLabel>
                    <Select value={niche} onValueChange={setNiche}>
                      <SelectTrigger id="niche-select" className="w-full h-10 bg-background border border-input rounded-xl px-3 text-left">
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
                  <Field>
                    <FieldLabel htmlFor="topic-input" className="text-xs font-semibold text-muted-foreground mb-1">
                      Your Topic / Core Insight
                    </FieldLabel>
                    <input
                      id="topic-input"
                      type="text"
                      placeholder="e.g. customized dark mode transitions"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="w-full bg-background border border-input rounded-xl px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary h-10"
                    />
                  </Field>
                </FieldGroup>
                
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full active-scale h-10 font-semibold rounded-xl flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin size-4" />
                      Formatting custom draft...
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4" />
                      Generate Draft using Pattern
                    </>
                  )}
                </Button>
              </form>

              {generatedDraft ? (
                <div className="flex-1 flex flex-col gap-3 mt-2 border-t border-border pt-4">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    AI Pattern Draft Output
                  </span>
                  
                  <div className="p-4 rounded-xl border border-border bg-background font-mono text-xs text-foreground whitespace-pre-wrap leading-relaxed min-h-[140px] flex-1">
                    {generatedDraft}
                  </div>

                  <div className="flex items-center justify-end gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={copyToClipboard}
                      className="active-scale text-xs gap-1.5 h-8 px-3 rounded-lg"
                    >
                      {isCopied ? (
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
                      onClick={sendToAnalyzer}
                      className="active-scale text-xs gap-1.5 h-8 px-3 rounded-lg"
                    >
                      <LineChart className="size-3.5 text-muted-foreground" />
                      <span>Analyze Copy</span>
                    </Button>

                    <Button
                      size="sm"
                      onClick={pushToContentOS}
                      className="active-scale text-xs gap-1.5 h-8 px-3 rounded-lg"
                    >
                      {isPushed ? (
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
                </div>
              ) : (
                !isLoading && (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-muted-foreground text-xs gap-1.5 border border-dashed border-border rounded-xl">
                    <Sparkles className="size-5 text-muted-foreground/50" />
                    <span>Enter your Topic above and click generate to fit it into the {selectedPattern.name} structure.</span>
                  </div>
                )
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Pattern Library</h2>
          <p className="text-sm text-muted-foreground">Proven structures and frameworks.</p>
        </div>
        <div className="flex-1 flex items-center justify-center min-h-[400px] text-xs text-muted-foreground">
          <Loader2 className="animate-spin size-6 text-primary mr-2" />
          Loading Patterns...
        </div>
      </div>
    }>
      <PatternsContent />
    </Suspense>
  );
}
