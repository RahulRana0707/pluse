"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { saveProfile, type ProfileInput } from "@/lib/actions/profile";

const TEXTAREA =
  "w-full rounded-xl border border-input bg-background p-3 text-sm leading-relaxed text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

export function ProfileDialog({
  open,
  onOpenChange,
  initial,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: ProfileInput | null;
  onSaved: (profile: ProfileInput) => void;
}) {
  const [form, setForm] = useState<ProfileInput>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(initial ?? {});
  }, [open, initial]);

  const set = (patch: Partial<ProfileInput>) => setForm((f) => ({ ...f, ...patch }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveProfile(form);
      onSaved(form);
      onOpenChange(false);
      toast.success("Profile saved.");
    } catch {
      toast.error("Couldn't save your profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Your creator profile</DialogTitle>
          <DialogDescription>
            This steers your daily posts — the more specific, the sharper the suggestions.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel className="text-xs font-semibold text-muted-foreground">About you</FieldLabel>
            <textarea
              rows={3}
              value={form.about ?? ""}
              onChange={(e) => set({ about: e.target.value })}
              placeholder="Who you are, what you build, what you talk about…"
              className={TEXTAREA}
            />
          </Field>
          <Field>
            <FieldLabel className="text-xs font-semibold text-muted-foreground">Content pillars</FieldLabel>
            <Input
              value={form.pillars ?? ""}
              onChange={(e) => set({ pillars: e.target.value })}
              placeholder="e.g. indie hacking, AI tools, design"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel className="text-xs font-semibold text-muted-foreground">Audience</FieldLabel>
              <Input
                value={form.audience ?? ""}
                onChange={(e) => set({ audience: e.target.value })}
                placeholder="e.g. early founders"
              />
            </Field>
            <Field>
              <FieldLabel className="text-xs font-semibold text-muted-foreground">Tone</FieldLabel>
              <Input
                value={form.tone ?? ""}
                onChange={(e) => set({ tone: e.target.value })}
                placeholder="e.g. direct, practical"
              />
            </Field>
          </div>
          <Field>
            <FieldLabel className="text-xs font-semibold text-muted-foreground">Goal</FieldLabel>
            <Input
              value={form.goal ?? ""}
              onChange={(e) => set({ goal: e.target.value })}
              placeholder="e.g. grow to 10k, land clients"
            />
          </Field>
          <Field>
            <FieldLabel className="text-xs font-semibold text-muted-foreground">
              Example posts (voice seed)
            </FieldLabel>
            <textarea
              rows={5}
              value={form.voiceSamples ?? ""}
              onChange={(e) => set({ voiceSamples: e.target.value })}
              placeholder={"Paste 5–10 of your best posts, one per line.\nUsed to match your voice until you've published enough through Pulse."}
              className={TEXTAREA}
            />
            <p className="text-[11px] text-muted-foreground">One post per line. Especially useful when you&apos;re just starting out.</p>
          </Field>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving} className="rounded-xl">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-1.5 rounded-xl font-semibold">
            {saving && <Loader2 className="size-4 animate-spin" />}
            Save profile
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
