"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Trash2,
  Plus,
  FolderKanban,
  Sparkles,
  Loader2,
  TrendingUp,
  AlertTriangle,
  Zap,
  Edit3,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PulseAI } from "@/lib/ai-sdk";
import { listDrafts, createDraft, updateDraft, deleteDraft, logPerformance } from "@/lib/actions/drafts";
import { useProfile } from "@/components/profile-provider";
import { voicePromptBlock } from "@/lib/ai/voice";

interface CardPerformance {
  views: number | null;
  likes: number | null;
  replies: number | null;
  reposts: number | null;
  recordedAt: Date;
}

interface KanbanCard {
  id: string;
  title: string;
  niche: string;
  status: "Ideas" | "Drafting" | "Review" | "Published";
  draftText: string;
  performance: CardPerformance | null;
}

type DraftRow = Awaited<ReturnType<typeof listDrafts>>[number];

const toCard = (draft: DraftRow): KanbanCard => {
  const latest = draft.performance?.[0];
  return {
    id: draft.id,
    title: draft.title ?? "",
    niche: draft.niche ?? "",
    status: (draft.status as KanbanCard["status"]) ?? "Ideas",
    draftText: draft.body,
    performance: latest
      ? {
          views: latest.views,
          likes: latest.likes,
          replies: latest.replies,
          reposts: latest.reposts,
          recordedAt: latest.recordedAt,
        }
      : null,
  };
};

const PERF_FIELDS = [
  ["views", "Views"],
  ["likes", "Likes"],
  ["replies", "Replies"],
  ["reposts", "Reposts"],
] as const;

type PerfKey = (typeof PERF_FIELDS)[number][0];

export default function Page() {
  const { profile } = useProfile();
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newNiche, setNewNiche] = useState("Software Engineering");

  // Dialog Editing State
  const [editingCard, setEditingCard] = useState<KanbanCard | null>(null);

  // Drag-and-drop State
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<KanbanCard["status"] | null>(null);

  // AI Copilot States
  const [copilotTone, setCopilotTone] = useState("Casual");
  const [copilotFormat, setCopilotFormat] = useState("Thread");
  const [isCopilotLoading, setIsCopilotLoading] = useState(false);

  // Live Analyzer States
  const [analyzerResults, setAnalyzerResults] = useState<{
    virality: number;
    readability: string;
    suggestions: string[];
    rewrites?: { style: string; text: string }[];
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Manual performance logging (real numbers vs the AI's prediction).
  const [perfInput, setPerfInput] = useState<Partial<Record<PerfKey, string>>>({});
  const [loggingPerf, setLoggingPerf] = useState(false);

  useEffect(() => {
    listDrafts()
      .then((drafts) => setCards(drafts.map(toCard)))
      .catch(() => toast.error("Couldn't load your drafts."));
  }, []);

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error("Please enter a concept title");
      return;
    }

    try {
      const draft = await createDraft({
        title: newTitle.trim(),
        body: newTitle.trim(),
        niche: newNiche,
        status: "Ideas",
      });
      setCards((prev) => [...prev, toCard(draft)]);
      setNewTitle("");
      toast.success("Concept added to Ideas!");
    } catch {
      toast.error("Couldn't save the concept.");
    }
  };

  const handleDeleteCard = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering edit dialog
    setCards((prev) => prev.filter((c) => c.id !== id));
    try {
      await deleteDraft(id);
      toast.info("Concept removed.");
    } catch {
      toast.error("Couldn't remove the concept.");
    }
  };

  // Move a dragged card into a new column and persist the status change.
  const handleDropOnColumn = async (status: KanbanCard["status"]) => {
    const id = draggingId;
    setDraggingId(null);
    setDragOverColumn(null);
    if (!id) return;

    const card = cards.find((c) => c.id === id);
    if (!card || card.status === status) return;

    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    try {
      await updateDraft(id, { status });
      toast.success(`Moved to ${status}.`);
    } catch {
      setCards((prev) => prev.map((c) => (c.id === id ? { ...c, status: card.status } : c)));
      toast.error("Couldn't move the concept.");
    }
  };

  // Open editor
  const openEditor = (card: KanbanCard) => {
    setEditingCard({ ...card });
    setAnalyzerResults(null);
    const p = card.performance;
    setPerfInput({
      views: p?.views?.toString() ?? "",
      likes: p?.likes?.toString() ?? "",
      replies: p?.replies?.toString() ?? "",
      reposts: p?.reposts?.toString() ?? "",
    });
  };

  // Log a real-performance snapshot for the current draft.
  const handleLogPerformance = async () => {
    if (!editingCard) return;
    const parse = (v?: string) => {
      const n = Number(v);
      return v != null && v.trim() !== "" && Number.isFinite(n) ? n : null;
    };
    const payload = {
      views: parse(perfInput.views),
      likes: parse(perfInput.likes),
      replies: parse(perfInput.replies),
      reposts: parse(perfInput.reposts),
    };
    if (Object.values(payload).every((v) => v == null)) {
      toast.error("Enter at least one metric.");
      return;
    }
    setLoggingPerf(true);
    try {
      const row = await logPerformance(editingCard.id, payload);
      const snapshot: CardPerformance = { ...payload, recordedAt: row.recordedAt };
      setCards((prev) => prev.map((c) => (c.id === editingCard.id ? { ...c, performance: snapshot } : c)));
      setEditingCard((prev) => (prev ? { ...prev, performance: snapshot } : prev));
      toast.success("Performance logged.");
    } catch {
      toast.error("Couldn't log performance.");
    } finally {
      setLoggingPerf(false);
    }
  };

  // Save card editing details
  const saveCardDetails = async () => {
    if (!editingCard) return;
    const card = editingCard;
    setCards((prev) => prev.map((c) => (c.id === card.id ? card : c)));
    setEditingCard(null);
    try {
      await updateDraft(card.id, {
        title: card.title,
        body: card.draftText,
        niche: card.niche,
        status: card.status,
      });
      toast.success("Changes saved successfully!");
    } catch {
      toast.error("Couldn't save your changes.");
    }
  };

  // AI Copilot Actions
  const runCopilotAction = async (actionType: "hook" | "autocomplete" | "tone" | "repurpose") => {
    if (!editingCard) return;
    setIsCopilotLoading(true);

    try {
      const ai = new PulseAI({ apiKey: "virtual-key" });
      const model = ai.getGenerativeModel();

      let prompt = "";
      if (actionType === "hook") {
        prompt = `Generate hook from concept: ${editingCard.title}`;
      } else if (actionType === "autocomplete") {
        prompt = `Autocomplete: ${editingCard.draftText}`;
      } else if (actionType === "tone") {
        prompt = `Rewrite with tone: ${copilotTone}, text: ${editingCard.draftText}`;
      } else if (actionType === "repurpose") {
        prompt = `Repurpose draft format: ${copilotFormat}, text: ${editingCard.draftText}`;
      }

      const response = await model.generateContent(prompt + voicePromptBlock(profile));
      const output = response.response.text();

      setEditingCard((prev) => {
        if (!prev) return null;
        if (actionType === "hook" || actionType === "tone" || actionType === "repurpose") {
          return { ...prev, draftText: output };
        } else {
          // autocomplete appends
          return { ...prev, draftText: output };
        }
      });

      toast.success("AI suggestion loaded!");
    } catch {
      toast.error("AI action failed.");
    } finally {
      setIsCopilotLoading(false);
    }
  };

  // Apply an analyzer rewrite straight into the draft body.
  const applyRewrite = (text: string) => {
    setEditingCard((prev) => (prev ? { ...prev, draftText: text } : prev));
    toast.success("Rewrite applied to your draft.");
  };

  // Live Analyzer Action inside Dialog
  const runLiveAnalysis = async () => {
    if (!editingCard || !editingCard.draftText.trim()) {
      toast.error("Write some draft text first");
      return;
    }
    setIsAnalyzing(true);
    try {
      const ai = new PulseAI({ apiKey: "virtual-key" });
      const model = ai.getGenerativeModel();
      const prompt = `Analyze draft: ${editingCard.draftText}` + voicePromptBlock(profile);

      const response = await model.generateContent(prompt);
      const data = JSON.parse(response.response.text());
      
      setAnalyzerResults({
        virality: data.virality,
        readability: data.readability,
        suggestions: data.suggestions,
        rewrites: Array.isArray(data.rewrites) ? data.rewrites : undefined,
      });
      toast.success("Real-time analysis updated!");
    } catch {
      toast.error("Failed to execute live analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderColumn = (status: KanbanCard["status"], label: string) => {
    const columnCards = cards.filter((c) => c.status === status);
    return (
      <Card
        onDragOver={(e) => {
          e.preventDefault();
          setDragOverColumn(status);
        }}
        onDrop={() => handleDropOnColumn(status)}
        className={cn(
          "border border-border bg-card flex flex-col gap-3 p-4 min-h-[420px] rounded-2xl transition-colors",
          dragOverColumn === status && "border-primary/60 bg-primary/5"
        )}
      >
        <div className="flex justify-between items-center pb-2 border-b border-border">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {label} ({columnCards.length})
          </span>
        </div>
        <div className="flex-1 flex flex-col gap-3">
          {columnCards.length > 0 ? (
            columnCards.map((card) => (
              <div
                key={card.id}
                draggable
                onDragStart={() => setDraggingId(card.id)}
                onDragEnd={() => {
                  setDraggingId(null);
                  setDragOverColumn(null);
                }}
                onClick={() => openEditor(card)}
                className={cn(
                  "p-4 rounded-2xl bg-muted/40 border border-border flex flex-col gap-3 justify-between shadow-sm hover:border-primary/40 cursor-grab active:cursor-grabbing transition-all duration-150 group",
                  draggingId === card.id && "opacity-50"
                )}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                      {card.niche}
                    </Badge>
                    <Edit3 className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h4 className="text-xs font-semibold text-foreground leading-relaxed">
                    {card.title}
                  </h4>
                  {card.draftText && (
                    <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {card.draftText}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-end border-t border-border/60 pt-2 gap-1.5">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7 text-destructive hover:bg-destructive/10 active-scale rounded-lg"
                    onClick={(e) => handleDeleteCard(card.id, e)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-border rounded-2xl text-[10px] text-muted-foreground p-4 gap-1.5">
              <FolderKanban className="size-5 text-muted-foreground/30" />
              <span>No items</span>
            </div>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Content OS</h2>
        <p className="text-sm text-muted-foreground">
          Content production workflow system. Move concepts seamlessly from Idea to Published.
        </p>
      </div>

      {/* Concept Creator Form */}
      <Card className="border border-border bg-card p-4 rounded-2xl">
        <form onSubmit={handleAddCard} className="flex flex-col sm:flex-row items-end gap-4">
          <FieldGroup className="flex-1 grid sm:grid-cols-3 gap-4">
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="new-card-title" className="text-xs font-semibold text-muted-foreground">
                Concept Title
              </FieldLabel>
              <input
                id="new-card-title"
                type="text"
                placeholder="e.g. 5 design mistakes keeping you broke..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-background border border-input rounded-xl px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary h-10"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="new-card-niche" className="text-xs font-semibold text-muted-foreground">
                Select Niche
              </FieldLabel>
              <Select value={newNiche} onValueChange={setNewNiche}>
                <SelectTrigger id="new-card-niche" className="w-full h-10 bg-background border border-input rounded-xl px-3 text-left">
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
          <Button type="submit" className="active-scale h-10 px-5 gap-1.5 font-semibold rounded-xl w-full sm:w-auto shrink-0">
            <Plus className="size-4" />
            <span>Add Concept</span>
          </Button>
        </form>
      </Card>

      {/* Kanban Board Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {renderColumn("Ideas", "Ideas")}
        {renderColumn("Drafting", "Drafting")}
        {renderColumn("Review", "Review")}
        {renderColumn("Published", "Published")}
      </div>

      {/* Content Drafting & AI Copilot Workspace Dialog */}
      {editingCard && (
        <Dialog open={!!editingCard} onOpenChange={(open) => !open && setEditingCard(null)}>
          <DialogContent className="max-w-4xl sm:max-w-4xl w-[95vw] md:w-full max-h-[90vh] overflow-y-auto p-6 bg-card border border-border rounded-3xl shadow-2xl">
            <DialogHeader className="pb-3 border-b border-border">
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Zap className="size-4 text-primary fill-primary" />
                Drafting Editor & AI Copilot
              </DialogTitle>
              <DialogDescription>
                Edit your draft copy, switch statuses, and use AI to autocomplete or repurpose text.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 md:grid-cols-5 pt-4">
              {/* Left Column (span 3): The Editor Area */}
              <div className="md:col-span-3 space-y-4 min-w-0">
                <FieldGroup className="flex flex-col gap-4">
                  <Field>
                    <FieldLabel htmlFor="edit-title" className="text-xs font-semibold text-muted-foreground">
                      Concept Title
                    </FieldLabel>
                    <input
                      id="edit-title"
                      type="text"
                      value={editingCard.title}
                      onChange={(e) => setEditingCard({ ...editingCard, title: e.target.value })}
                      className="w-full bg-background border border-input rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1"
                    />
                  </Field>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="edit-niche" className="text-xs font-semibold text-muted-foreground">
                        Niche Segment
                      </FieldLabel>
                      <Select
                        value={editingCard.niche}
                        onValueChange={(val) => setEditingCard({ ...editingCard, niche: val })}
                      >
                        <SelectTrigger id="edit-niche" className="w-full h-10 bg-background border border-input rounded-xl px-3 text-left">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent position="popper" className="w-full">
                          <SelectItem value="Software Engineering">Software Engineering</SelectItem>
                          <SelectItem value="Design & UIUX">Design & UIUX</SelectItem>
                          <SelectItem value="Marketing & Growth">Marketing & Growth</SelectItem>
                          <SelectItem value="Cryptocurrency & Web3">Cryptocurrency & Web3</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="edit-status" className="text-xs font-semibold text-muted-foreground">
                        Board Status
                      </FieldLabel>
                      <Select
                        value={editingCard.status}
                        onValueChange={(val: any) => setEditingCard({ ...editingCard, status: val })}
                      >
                        <SelectTrigger id="edit-status" className="w-full h-10 bg-background border border-input rounded-xl px-3 text-left">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent position="popper" className="w-full">
                          <SelectItem value="Ideas">Ideas</SelectItem>
                          <SelectItem value="Drafting">Drafting</SelectItem>
                          <SelectItem value="Review">Review</SelectItem>
                          <SelectItem value="Published">Published</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                  <Field>
                    <FieldLabel htmlFor="edit-draftText" className="text-xs font-semibold text-muted-foreground">
                      Draft Body Content
                    </FieldLabel>
                    <textarea
                      id="edit-draftText"
                      rows={8}
                      value={editingCard.draftText}
                      onChange={(e) => setEditingCard({ ...editingCard, draftText: e.target.value })}
                      placeholder="Write your raw copy here..."
                      className="w-full bg-background border border-input rounded-xl p-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 min-h-[160px] leading-relaxed font-mono"
                    />
                  </Field>
                </FieldGroup>
              </div>

              {/* Right Column (span 2): AI Copilot Workbench & Live Analyzer */}
              <div className="col-span-1 md:col-span-2 min-w-0 space-y-4 border-t md:border-t-0 md:border-l border-border/80 pt-6 md:pt-0 pl-0 md:pl-6 flex flex-col justify-between">
                {/* AI Drafting tools */}
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    AI Copilot Workspace
                  </span>
                  
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => runCopilotAction("hook")}
                      disabled={isCopilotLoading}
                      className="w-full h-auto min-h-8 py-1.5 justify-start text-left whitespace-normal leading-snug text-xs font-medium rounded-xl gap-2 active-scale"
                    >
                      <Sparkles className="size-3.5 text-primary fill-primary" />
                      Generate Hook from Title
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => runCopilotAction("autocomplete")}
                      disabled={isCopilotLoading}
                      className="w-full h-auto min-h-8 py-1.5 justify-start text-left whitespace-normal leading-snug text-xs font-medium rounded-xl gap-2 active-scale"
                    >
                      <Sparkles className="size-3.5 text-primary fill-primary" />
                      Autocomplete Next Sentence
                    </Button>
                  </div>

                  <Separator />

                  {/* Tone switcher */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground font-semibold">Change Tone</label>
                    <div className="flex items-center gap-1.5">
                      <Select value={copilotTone} onValueChange={setCopilotTone}>
                        <SelectTrigger className="h-8 text-xs rounded-xl bg-background border-input flex-1 min-w-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          <SelectItem value="Casual">Casual</SelectItem>
                          <SelectItem value="Professional">Professional</SelectItem>
                          <SelectItem value="Analytical">Analytical</SelectItem>
                          <SelectItem value="Hype">Hype</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        disabled={isCopilotLoading}
                        onClick={() => runCopilotAction("tone")}
                        className="h-8 text-xs rounded-xl font-semibold active-scale px-3"
                      >
                        Rewrite
                      </Button>
                    </div>
                  </div>

                  {/* Repurpose format */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground font-semibold">Repurpose Format</label>
                    <div className="flex items-center gap-1.5">
                      <Select value={copilotFormat} onValueChange={setCopilotFormat}>
                        <SelectTrigger className="h-8 text-xs rounded-xl bg-background border-input flex-1 min-w-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          <SelectItem value="Thread">Thread format</SelectItem>
                          <SelectItem value="LinkedIn">LinkedIn post</SelectItem>
                          <SelectItem value="Newsletter">Newsletter email</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        disabled={isCopilotLoading}
                        onClick={() => runCopilotAction("repurpose")}
                        className="h-8 text-xs rounded-xl font-semibold active-scale px-3"
                      >
                        Convert
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Live Analyzer Widget */}
                <div className="space-y-2 flex-1 flex flex-col justify-end mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Live Tweet Analyzer
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={runLiveAnalysis}
                      disabled={isAnalyzing}
                      className="h-6 text-[10px] text-primary hover:bg-primary/10 rounded-lg"
                    >
                      {isAnalyzing ? (
                        <Loader2 className="animate-spin size-3" />
                      ) : (
                        "Run Analyzer"
                      )}
                    </Button>
                  </div>

                  {analyzerResults ? (
                    <div className="p-3 bg-muted/40 border border-border rounded-xl text-xs space-y-2.5 max-h-[240px] overflow-y-auto">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Predicted virality:</span>
                        <span className="font-bold text-emerald-500 flex items-center gap-0.5">
                          <TrendingUp className="size-3" />
                          {analyzerResults.virality}/10
                        </span>
                      </div>
                      <div className="text-[10px] leading-tight space-y-1">
                        <span className="text-muted-foreground font-semibold uppercase block">Suggestions:</span>
                        {analyzerResults.suggestions.map((suggestion, idx) => (
                          <div key={idx} className="flex gap-1.5 text-foreground leading-normal align-top">
                            <AlertTriangle className="size-3 text-amber-500 shrink-0 mt-0.5" />
                            <span>{suggestion}</span>
                          </div>
                        ))}
                      </div>
                      {analyzerResults.rewrites && analyzerResults.rewrites.length > 0 && (
                        <div className="space-y-1.5 border-t border-border/60 pt-2">
                          <span className="text-muted-foreground font-semibold uppercase block text-[10px]">
                            Apply a rewrite:
                          </span>
                          {analyzerResults.rewrites.map((rewrite, idx) => (
                            <div key={idx} className="flex items-start gap-1.5">
                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-semibold text-foreground">{rewrite.style}</p>
                                <p className="text-[10px] text-muted-foreground line-clamp-2 leading-snug">
                                  {rewrite.text}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => applyRewrite(rewrite.text)}
                                className="h-6 shrink-0 rounded-lg px-2 text-[10px] active-scale"
                              >
                                Apply
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 border border-dashed border-border rounded-xl text-center text-[10px] text-muted-foreground py-6">
                      Click &quot;Run Analyzer&quot; to score your current draft.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {editingCard.status === "Published" && (
              <div className="mt-4 space-y-3 rounded-2xl border border-border bg-muted/30 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <BarChart3 className="size-3.5" />
                      Actual performance (logged manually)
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Real numbers from X — builds a feedback dataset against the AI&apos;s predictions.
                    </span>
                  </div>
                  {editingCard.performance?.recordedAt && (
                    <span className="text-[10px] text-muted-foreground">
                      Last logged {new Date(editingCard.performance.recordedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {PERF_FIELDS.map(([key, label]) => (
                    <div key={key} className="flex flex-col gap-1">
                      <label className="text-[10px] font-semibold text-muted-foreground">{label}</label>
                      <input
                        type="number"
                        min="0"
                        inputMode="numeric"
                        value={perfInput[key] ?? ""}
                        onChange={(e) => setPerfInput((p) => ({ ...p, [key]: e.target.value }))}
                        placeholder="—"
                        className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleLogPerformance}
                    disabled={loggingPerf}
                    className="active-scale h-8 gap-1.5 rounded-xl text-xs"
                  >
                    {loggingPerf ? <Loader2 className="size-3.5 animate-spin" /> : <BarChart3 className="size-3.5" />}
                    Log performance
                  </Button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 border-t border-border pt-4 mt-4">
              <Button variant="ghost" onClick={() => setEditingCard(null)} className="h-9 px-4 rounded-xl text-xs active-scale">
                Cancel
              </Button>
              <Button onClick={saveCardDetails} className="h-9 px-6 rounded-xl text-xs active-scale font-semibold">
                Save Draft Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
