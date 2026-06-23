"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Sparkles, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { listItems, removeItem } from "@/lib/actions/creators";
import { SEED_CREATORS } from "@/lib/x/seed-creators";
import { TweetCard } from "@/components/inspiration/tweet-card";
import { RemixButton } from "@/components/inspiration/remix-button";
import { AddCreatorDialog } from "@/components/inspiration/add-creator-dialog";
import { JourneyTab } from "@/components/inspiration/journey-tab";

type Item = Awaited<ReturnType<typeof listItems>>[number];

interface TweetEntry {
  tweetId: string;
  handle: string;
  itemId?: string;
}

interface CreatorView {
  handle: string;
  name: string;
  isSeed: boolean;
  tweets: TweetEntry[];
}

const ALL = "__all__";

const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export default function Page() {
  const [items, setItems] = useState<Item[]>([]);
  const [active, setActive] = useState<string>(ALL);
  const [dialogOpen, setDialogOpen] = useState(false);

  const refresh = () =>
    listItems()
      .then(setItems)
      .catch(() => toast.error("Couldn't load your swipe file."));

  useEffect(() => {
    refresh();
  }, []);

  const creators = useMemo<CreatorView[]>(() => {
    const map = new Map<string, CreatorView>();
    for (const seed of SEED_CREATORS) {
      map.set(seed.handle, {
        handle: seed.handle,
        name: seed.name,
        isSeed: true,
        tweets: seed.tweetIds.map((tweetId) => ({ tweetId, handle: seed.handle })),
      });
    }
    for (const item of items) {
      const handle = item.creator?.handle ?? "unknown";
      let view = map.get(handle);
      if (!view) {
        view = { handle, name: item.creator?.name ?? handle, isSeed: false, tweets: [] };
        map.set(handle, view);
      }
      const existing = view.tweets.find((t) => t.tweetId === item.tweetId);
      if (existing) existing.itemId = item.id;
      else view.tweets.unshift({ tweetId: item.tweetId, handle, itemId: item.id });
    }
    return Array.from(map.values());
  }, [items]);

  const visibleTweets = useMemo(() => {
    const source = active === ALL ? creators : creators.filter((c) => c.handle === active);
    const seen = new Set<string>();
    const out: TweetEntry[] = [];
    for (const c of source) {
      for (const t of c.tweets) {
        if (seen.has(t.tweetId)) continue;
        seen.add(t.tweetId);
        out.push(t);
      }
    }
    return out;
  }, [creators, active]);

  const handleRemove = async (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    try {
      await removeItem(itemId);
      toast.info("Removed from your swipe file.");
    } catch {
      toast.error("Couldn't remove that — reloading.");
      refresh();
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Inspiration</h2>
          <p className="text-sm text-muted-foreground">
            Your swipe file. Study what works, save the best, and remix it into your own posts.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="active-scale gap-1.5 rounded-xl font-semibold">
          <Plus className="size-4" />
          Add creator
        </Button>
      </div>

      <Tabs defaultValue="creators">
        <TabsList>
          <TabsTrigger value="creators">Creators</TabsTrigger>
          <TabsTrigger value="journey">Your Journey</TabsTrigger>
        </TabsList>

        <TabsContent value="creators" className="flex flex-col gap-5 pt-3">
          {/* Creator filter chips */}
          <div className="flex flex-wrap gap-2">
            <Chip label="All" active={active === ALL} onClick={() => setActive(ALL)} />
            {creators.map((c) => (
              <Chip
                key={c.handle}
                label={c.name}
                avatar={initials(c.name)}
                active={active === c.handle}
                onClick={() => setActive(c.handle)}
              />
            ))}
          </div>

          {visibleTweets.length > 0 ? (
            <div className="gap-4 [column-fill:_balance] sm:columns-2 xl:columns-3">
              {visibleTweets.map((t) => (
                <div key={t.tweetId} className="mb-4 break-inside-avoid">
                  <TweetCard
                    id={t.tweetId}
                    actions={
                      <>
                        <RemixButton tweetId={t.tweetId} handle={t.handle} />
                        {t.itemId && (
                          <Button
                            size="icon"
                            variant="secondary"
                            onClick={() => handleRemove(t.itemId!)}
                            aria-label="Remove from swipe file"
                            className="active-scale size-7 rounded-lg text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        )}
                      </>
                    }
                  />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState onAdd={() => setDialogOpen(true)} />
          )}
        </TabsContent>

        <TabsContent value="journey" className="pt-3">
          <JourneyTab />
        </TabsContent>
      </Tabs>

      <AddCreatorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSaved={(handle) => {
          refresh();
          if (handle) setActive(handle);
        }}
      />
    </div>
  );
}

function Chip({
  label,
  avatar,
  active,
  onClick,
}: {
  label: string;
  avatar?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "active-scale flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-transparent bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/60",
      )}
    >
      {avatar && (
        <Avatar className="-ml-1 size-5">
          <AvatarFallback className="text-[9px] font-semibold">{avatar}</AvatarFallback>
        </Avatar>
      )}
      {label}
    </button>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <Card className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-2xl border-dashed p-8 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-muted">
        <Sparkles className="size-5 text-muted-foreground" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-foreground">Start your swipe file</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Paste any tweet to save it, and it&apos;ll show up here grouped by creator.
        </p>
      </div>
      <Button onClick={onAdd} className="active-scale mt-1 gap-1.5 rounded-xl font-semibold">
        <Plus className="size-4" />
        Add creator
      </Button>
    </Card>
  );
}
