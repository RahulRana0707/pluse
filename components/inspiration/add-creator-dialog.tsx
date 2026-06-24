"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Link2 } from "lucide-react";
import { toast } from "sonner";
import { saveItemFromUrl } from "@/lib/actions/creators";

export function AddCreatorDialog({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (handle: string) => void;
}) {
  const [url, setUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!url.trim()) {
      toast.error("Paste a tweet URL first.");
      return;
    }
    setIsSaving(true);
    try {
      const item = await saveItemFromUrl(url.trim());
      setUrl("");
      toast.success(`Saved a tweet from @${item.creator?.handle}.`);
      onSaved(item.creator?.handle ?? "");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't save that tweet.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Add to your swipe file</DialogTitle>
          <DialogDescription>
            Paste any tweet to save it — it&apos;ll appear grouped under its creator.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Link2 className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                placeholder="https://x.com/levelsio/status/..."
                className="pl-9"
              />
            </div>
            <Button onClick={handleSave} disabled={isSaving} className="active-scale shrink-0">
              {isSaving ? <Loader2 className="size-4 animate-spin" /> : "Save"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Auto-loading a creator&apos;s latest posts by handle is coming — it needs a (free) data
            key, which we&apos;ll wire in behind the scenes.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
