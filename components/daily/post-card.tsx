"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Copy, Plus, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GeneratedPost {
  id: string;
  text: string;
  angle: string;
  pillar: string;
  virality: number;
}

export function PostCard({
  post,
  selected,
  added,
  onToggle,
  onCopy,
  onAdd,
}: {
  post: GeneratedPost;
  selected: boolean;
  added: boolean;
  onToggle: () => void;
  onCopy: () => void;
  onAdd: () => void;
}) {
  const score = Number.isFinite(post.virality) ? post.virality.toFixed(1) : "—";
  return (
    <Card
      size="sm"
      onClick={onToggle}
      className={cn(
        "cursor-pointer gap-3 p-4 transition-shadow",
        selected ? "ring-2 ring-primary" : "hover:shadow-md",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge
            title="Predicted virality (AI estimate, not measured)"
            className="gap-0.5 border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10"
          >
            <TrendingUp className="size-3" />
            {score} pred.
          </Badge>
          {post.angle && (
            <Badge variant="outline" className="text-[10px] text-primary">
              {post.angle}
            </Badge>
          )}
          {post.pillar && (
            <Badge variant="outline" className="text-[10px] text-muted-foreground">
              {post.pillar}
            </Badge>
          )}
        </div>
        <span
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
            selected ? "border-primary bg-primary text-primary-foreground" : "border-border",
          )}
        >
          {selected && <Check className="size-3.5" />}
        </span>
      </div>

      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{post.text}</p>

      <div className="flex items-center justify-end gap-1.5 border-t border-border/60 pt-2.5">
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onCopy();
          }}
          className="active-scale h-7 gap-1.5 rounded-lg text-xs"
        >
          <Copy className="size-3" /> Copy
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            onAdd();
          }}
          disabled={added}
          className="active-scale h-7 gap-1.5 rounded-lg text-xs"
        >
          {added ? (
            <>
              <Check className="size-3 text-emerald-500" /> Added
            </>
          ) : (
            <>
              <Plus className="size-3" /> Add to OS
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
