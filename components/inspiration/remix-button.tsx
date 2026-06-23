"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Sparkles, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { PulseAI } from "@/lib/ai-sdk";
import { getTweetText } from "@/lib/actions/creators";
import { createDraft } from "@/lib/actions/drafts";

/**
 * Remixes a tweet into a Content OS draft. Clicking opens a preview where the
 * AI rewrite (in the user's voice) is shown for review/edit before it's saved —
 * so the swipe-file -> original-post loop is visible, not a blind hand-off.
 */
export function RemixButton({ tweetId, handle }: { tweetId: string; handle?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState("");

  const generate = async () => {
    setGenerating(true);
    try {
      const text = await getTweetText(tweetId);
      if (!text) {
        toast.error("Couldn't read that tweet to remix.");
        setOpen(false);
        return;
      }
      const model = new PulseAI({ apiKey: "virtual-key" }).getGenerativeModel();
      const prompt = `Rewrite the following tweet as ONE original post in clear, natural English. Output only the rewritten post as plain text — no preamble, no alternatives, no notes, no translations, no other languages.\n\nTweet: "${text}"`;
      setDraft((await model.generateContent(prompt)).response.text().trim());
    } catch {
      toast.error("Remix failed.");
      setOpen(false);
    } finally {
      setGenerating(false);
    }
  };

  const openEditor = () => {
    setDraft("");
    setOpen(true);
    generate();
  };

  const save = async () => {
    if (!draft.trim()) return;
    setSaving(true);
    try {
      await createDraft({
        title: handle ? `Remix of @${handle}` : "Remix",
        body: draft.trim(),
        status: "Drafting",
        source: `inspiration:${tweetId}`,
      });
      setOpen(false);
      toast.success("Saved to Content OS as a draft.", {
        action: { label: "View", onClick: () => router.push("/dashboard/content-os") },
      });
    } catch {
      toast.error("Couldn't save the draft.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button
        size="icon"
        variant="secondary"
        onClick={openEditor}
        aria-label="Remix into Content OS"
        className="active-scale size-7 rounded-lg"
      >
        <Sparkles className="size-3.5 text-primary" />
      </Button>

      <Dialog open={open} onOpenChange={(next) => !saving && setOpen(next)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              Remix into a draft
            </DialogTitle>
            <DialogDescription>
              {handle ? `Rewritten from @${handle} in your own voice. ` : "Rewritten in your own voice. "}
              Edit it, then save to Content OS.
            </DialogDescription>
          </DialogHeader>

          {generating ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="size-5 animate-spin text-primary" />
              Remixing…
            </div>
          ) : (
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={8}
              placeholder="Your remixed post…"
              className="w-full min-h-[180px] rounded-xl border border-input bg-background p-3 text-sm leading-relaxed text-foreground placeholder-muted-foreground focus:border-primary focus:ring-1 focus:outline-none"
            />
          )}

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={generate}
              disabled={generating || saving}
              className="active-scale gap-1.5 rounded-xl"
            >
              <RefreshCw className="size-3.5" />
              Regenerate
            </Button>
            <Button
              onClick={save}
              disabled={generating || saving || !draft.trim()}
              className="active-scale gap-1.5 rounded-xl font-semibold"
            >
              {saving && <Loader2 className="size-3.5 animate-spin" />}
              Save to Content OS
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
