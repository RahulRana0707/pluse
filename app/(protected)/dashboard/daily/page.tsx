"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Settings2, Plus, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { PulseAI } from "@/lib/ai-sdk";
import { getGenerationContext, type GenerationContext } from "@/lib/actions/daily";
import { createDraft } from "@/lib/actions/drafts";
import { useProfile } from "@/components/profile-provider";
import { voiceSampleList } from "@/lib/ai/voice";
import { ProfileDialog } from "@/components/daily/profile-dialog";
import { PostCard, type GeneratedPost } from "@/components/daily/post-card";

const clip = (text: string) => text.replace(/\n+/g, " ").slice(0, 200);

function buildPrompt(ctx: GenerationContext): string {
  const p = ctx.profile;
  const profileBlock = p
    ? [
        p.about && `About: ${p.about}`,
        p.pillars && `Content pillars: ${p.pillars}`,
        p.audience && `Audience: ${p.audience}`,
        p.tone && `Tone: ${p.tone}`,
        p.goal && `Goal: ${p.goal}`,
      ]
        .filter(Boolean)
        .join("\n")
    : "(no profile set)";

  // Voice corpus = pasted seed posts + published posts (seed first), capped.
  const corpus = [...voiceSampleList(p), ...ctx.publishedPosts].slice(0, 10);
  const voiceCorpus = corpus.length ? corpus.map((t) => `- ${clip(t)}`).join("\n") : "(no samples yet)";
  const thinNote =
    corpus.length < 3
      ? "\nNote: few voice samples are available — lean on the profile's tone, pillars, and goal above to infer the voice."
      : "";
  const inspiration = ctx.inspiration.length
    ? ctx.inspiration.map((t) => `- ${clip(t)}`).join("\n")
    : "(none yet)";

  return `Generate daily posts:

## Creator profile
${profileBlock}

## Posts in the creator's voice (match this style)
${voiceCorpus}${thinNote}

## Tweets that inspire them (for direction, do not copy)
${inspiration}`;
}

export default function Page() {
  const router = useRouter();
  const { profile, loaded: profileLoaded, setProfile } = useProfile();
  const [profileOpen, setProfileOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [posts, setPosts] = useState<GeneratedPost[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);

  const hasProfile = !!profile && Object.values(profile).some((v) => (v ?? "").trim());

  const generate = async () => {
    if (!hasProfile) {
      toast.error("Set up your profile first.");
      setProfileOpen(true);
      return;
    }
    setGenerating(true);
    setPosts(null);
    setSelected(new Set());
    setAddedIds(new Set());
    try {
      const ctx = await getGenerationContext();
      const model = new PulseAI({ apiKey: "virtual-key" }).getGenerativeModel();
      const response = await model.generateContent(buildPrompt(ctx));
      const data = JSON.parse(response.response.text());

      const list: GeneratedPost[] = (data.posts ?? [])
        .filter((p: { text?: string }) => p?.text?.trim())
        .map((p: Partial<GeneratedPost>, i: number) => ({
          id: p.id || `p-${i + 1}`,
          text: (p.text ?? "").trim(),
          angle: p.angle ?? "",
          pillar: p.pillar ?? "",
          virality: typeof p.virality === "number" ? p.virality : Number(p.virality) || 0,
        }))
        .sort((a: GeneratedPost, b: GeneratedPost) => b.virality - a.virality);

      if (!list.length) throw new Error("empty");
      setPosts(list);
      toast.success(`Generated ${list.length} posts for today.`);
    } catch {
      toast.error("Couldn't generate posts. Try again.");
    } finally {
      setGenerating(false);
    }
  };

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const addPosts = async (list: GeneratedPost[]) => {
    if (!list.length) return;
    setAdding(true);
    try {
      await Promise.all(
        list.map((p) =>
          createDraft({
            title: p.text.split("\n")[0].slice(0, 60),
            body: p.text,
            status: "Ideas",
            source: "daily",
          }),
        ),
      );
      setAddedIds((prev) => new Set([...prev, ...list.map((p) => p.id)]));
      setSelected(new Set());
      toast.success(`Added ${list.length} to Content OS.`, {
        action: { label: "View", onClick: () => router.push("/dashboard/content-os") },
      });
    } catch {
      toast.error("Couldn't add to Content OS.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Daily Posts</h2>
          <p className="text-sm text-muted-foreground">
            Ten ready-to-post ideas tailored to your profile, your published posts, and your swipe file —
            ranked by predicted reach.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setProfileOpen(true)}
            className="active-scale gap-1.5 rounded-xl"
          >
            <Settings2 className="size-4" />
            {hasProfile ? "Edit profile" : "Set up profile"}
          </Button>
          <Button
            onClick={generate}
            disabled={generating}
            className="active-scale gap-1.5 rounded-xl font-semibold"
          >
            {generating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            Generate today&apos;s 10
          </Button>
        </div>
      </div>

      {/* Selection bar */}
      {posts && posts.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 pl-4">
          <div className="flex items-center gap-3 text-sm">
            <span className="font-semibold text-foreground">{selected.size} selected</span>
            <button
              onClick={() => setSelected(new Set(posts.map((p) => p.id)))}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Select all
            </button>
            {selected.size > 0 && (
              <button
                onClick={() => setSelected(new Set())}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>
          <Button
            onClick={() => addPosts(posts.filter((p) => selected.has(p.id)))}
            disabled={!selected.size || adding}
            className="active-scale gap-1.5 rounded-xl font-semibold"
          >
            {adding ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Add{selected.size ? ` ${selected.size}` : ""} to Content OS
          </Button>
        </div>
      )}

      {/* Body */}
      {generating ? (
        <Card className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-2xl p-8 text-center">
          <Loader2 className="size-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Studying your voice and writing today&apos;s posts…</p>
        </Card>
      ) : posts ? (
        <div className="grid gap-4 md:grid-cols-2">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              selected={selected.has(post.id)}
              added={addedIds.has(post.id)}
              onToggle={() => toggle(post.id)}
              onCopy={() => {
                navigator.clipboard.writeText(post.text);
                toast.success("Post copied.");
              }}
              onAdd={() => addPosts([post])}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          loaded={profileLoaded}
          hasProfile={hasProfile}
          onSetup={() => setProfileOpen(true)}
          onGenerate={generate}
        />
      )}

      <ProfileDialog
        open={profileOpen}
        onOpenChange={setProfileOpen}
        initial={profile}
        onSaved={setProfile}
      />
    </div>
  );
}

function EmptyState({
  loaded,
  hasProfile,
  onSetup,
  onGenerate,
}: {
  loaded: boolean;
  hasProfile: boolean;
  onSetup: () => void;
  onGenerate: () => void;
}) {
  if (!loaded) {
    return (
      <div className="flex min-h-[320px] items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin text-primary" />
        Loading…
      </div>
    );
  }
  return (
    <Card className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-2xl border-dashed p-8 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-muted">
        <CalendarDays className="size-5 text-muted-foreground" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-foreground">
          {hasProfile ? "Ready when you are" : "Set up your profile to start"}
        </p>
        <p className="max-w-sm text-sm text-muted-foreground">
          {hasProfile
            ? "Generate today's 10 posts and add the ones you like straight to Content OS."
            : "Tell Pulse who you are and what you post about, then generate a tailored batch every day."}
        </p>
      </div>
      <Button
        onClick={hasProfile ? onGenerate : onSetup}
        className="active-scale mt-1 gap-1.5 rounded-xl font-semibold"
      >
        {hasProfile ? <Sparkles className="size-4" /> : <Settings2 className="size-4" />}
        {hasProfile ? "Generate today's 10" : "Set up profile"}
      </Button>
    </Card>
  );
}
