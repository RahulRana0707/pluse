"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  defaultSavedArticleData,
  type ArticleOutlineSection,
  type ArticleWizardStep,
  type SavedArticleData,
} from "@/lib/articles/types";
import { runPlan, runExpand, runImageSlots, runImagePrompts } from "@/lib/articles/client";
import { createArticle, updateArticle } from "@/lib/actions/articles";

export type ArticleBusy = null | "plan" | "expand" | "slots" | "prompts" | "save";

export function useArticle(initial?: { id: string; data: SavedArticleData }) {
  const [data, setData] = useState<SavedArticleData>(initial?.data ?? defaultSavedArticleData());
  const [savedId, setSavedId] = useState<string | null>(initial?.id ?? null);
  const [busy, setBusy] = useState<ArticleBusy>(null);

  const update = (patch: Partial<SavedArticleData>) => setData((d) => ({ ...d, ...patch }));
  const setStep = (wizardStep: ArticleWizardStep) => update({ wizardStep });
  const intent = () => ({ topic: data.topic, audience: data.audience, tone: data.tone, promise: data.promise });

  const fail = (e: unknown, fallback: string) =>
    toast.error(e instanceof Error ? e.message : fallback);

  const generatePlan = async () => {
    if (!data.topic.trim()) {
      toast.error("Enter a topic first.");
      return;
    }
    setBusy("plan");
    try {
      const plan = await runPlan(intent());
      update({ ...plan, bodyMarkdown: "", generatedImagePrompts: [], wizardStep: "card" });
      toast.success("Article plan ready.");
    } catch (e) {
      fail(e, "Plan failed.");
    } finally {
      setBusy(null);
    }
  };

  const generateBody = async () => {
    setBusy("expand");
    // Switch to the draft step up front so the body streams in live.
    update({ bodyMarkdown: "", wizardStep: "body" });
    try {
      const markdown = await runExpand(
        {
          intent: intent(),
          workingTitle: data.workingTitle,
          previewHook: data.previewHook,
          outline: data.outline,
        },
        (partial) => update({ bodyMarkdown: partial }),
      );
      update({ bodyMarkdown: markdown });
      toast.success("Article body generated.");
    } catch (e) {
      fail(e, "Body generation failed.");
    } finally {
      setBusy(null);
    }
  };

  const suggestSlots = async () => {
    setBusy("slots");
    try {
      const s = await runImageSlots({
        topic: data.topic,
        workingTitle: data.workingTitle,
        previewHook: data.previewHook,
        articleMarkdown: data.bodyMarkdown,
      });
      update({
        imageTension: s.tension,
        imageMood: s.mood,
        imageMetaphor: s.metaphor,
        imageComposition: s.composition,
      });
      toast.success("Image slots suggested.");
    } catch (e) {
      fail(e, "Slot suggestion failed.");
    } finally {
      setBusy(null);
    }
  };

  const generatePrompts = async () => {
    setBusy("prompts");
    try {
      const prompts = await runImagePrompts({
        workingTitle: data.workingTitle,
        previewHook: data.previewHook,
        articleMarkdown: data.bodyMarkdown,
      });
      update({ generatedImagePrompts: prompts });
      toast.success(`Generated ${prompts.length} image prompts.`);
    } catch (e) {
      fail(e, "Image-prompt generation failed.");
    } finally {
      setBusy(null);
    }
  };

  const save = async (): Promise<string | null> => {
    setBusy("save");
    try {
      if (savedId) {
        await updateArticle(savedId, data);
        toast.success("Article saved.");
        return savedId;
      }
      const { id } = await createArticle(data);
      setSavedId(id);
      toast.success("Article saved.");
      return id;
    } catch (e) {
      fail(e, "Couldn't save the article.");
      return null;
    } finally {
      setBusy(null);
    }
  };

  const addOutlineSection = () =>
    update({ outline: [...data.outline, { id: `s_${data.outline.length + 1}_${Date.now()}`, title: "", beats: "" }] });
  const updateOutlineSection = (id: string, patch: Partial<ArticleOutlineSection>) =>
    update({ outline: data.outline.map((s) => (s.id === id ? { ...s, ...patch } : s)) });
  const removeOutlineSection = (id: string) =>
    update({ outline: data.outline.filter((s) => s.id !== id) });

  return {
    data,
    update,
    setStep,
    savedId,
    busy,
    generatePlan,
    generateBody,
    suggestSlots,
    generatePrompts,
    save,
    addOutlineSection,
    updateOutlineSection,
    removeOutlineSection,
  };
}
