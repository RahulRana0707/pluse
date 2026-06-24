"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link2, Loader2, RefreshCw, Unlink, Heart, MessageCircle, Repeat2, Eye } from "lucide-react";
import { toast } from "sonner";
import { getXStatus, getOwnTweets, disconnectX, type XStatus } from "@/lib/actions/x";

type OwnTweet = Awaited<ReturnType<typeof getOwnTweets>>[number];

const formatCount = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : `${n}`;

export function JourneyTab() {
  const [status, setStatus] = useState<XStatus | null>(null);
  const [tweets, setTweets] = useState<OwnTweet[] | null>(null);
  const [loadingTweets, setLoadingTweets] = useState(false);

  // Surface the OAuth redirect result, then clean the query string.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const result = params.get("x");
    if (result === "connected") toast.success("X account connected.");
    else if (result === "error") toast.error("Couldn't connect X. Try again.");
    if (result) {
      params.delete("x");
      const qs = params.toString();
      window.history.replaceState(null, "", window.location.pathname + (qs ? `?${qs}` : ""));
    }
  }, []);

  useEffect(() => {
    getXStatus()
      .then(setStatus)
      .catch(() => setStatus({ configured: false, connected: false, username: null }));
  }, []);

  const loadTweets = async () => {
    setLoadingTweets(true);
    try {
      setTweets(await getOwnTweets());
    } catch {
      toast.error("Couldn't load your tweets from X.");
    } finally {
      setLoadingTweets(false);
    }
  };

  useEffect(() => {
    if (status?.connected) loadTweets();
  }, [status?.connected]);

  const handleDisconnect = async () => {
    try {
      await disconnectX();
      setStatus({ configured: true, connected: false, username: null });
      setTweets(null);
      toast.info("Disconnected X.");
    } catch {
      toast.error("Couldn't disconnect.");
    }
  };

  if (!status) {
    return (
      <div className="flex min-h-[300px] items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin text-primary" />
        Loading…
      </div>
    );
  }

  // X integration not enabled on this deployment.
  if (!status.configured) {
    return (
      <Placeholder
        title="Connect with X — coming soon"
        body="Once X is enabled, link your account to pull your own recent posts and their real performance here."
      />
    );
  }

  // Enabled but the user hasn't linked their account yet.
  if (!status.connected) {
    return (
      <Card className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-2xl border-dashed p-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-muted">
          <Link2 className="size-5 text-muted-foreground" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-foreground">Connect your X account</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Read-only — Pulse pulls your recent posts and their real views, likes, replies, and reposts.
            It never posts for you.
          </p>
        </div>
        <Button asChild className="active-scale mt-1 gap-1.5 rounded-xl font-semibold">
          <a href="/api/x/connect">
            <Link2 className="size-4" />
            Connect X
          </a>
        </Button>
      </Card>
    );
  }

  // Connected — show the user's own tweets with real metrics.
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 pl-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-foreground">
            {status.username ? `@${status.username}` : "X connected"}
          </span>
          <span className="text-xs text-muted-foreground">· real metrics from X</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={loadTweets}
            disabled={loadingTweets}
            className="active-scale h-8 gap-1.5 rounded-xl text-xs"
          >
            <RefreshCw className={`size-3.5 ${loadingTweets ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDisconnect}
            className="active-scale h-8 gap-1.5 rounded-xl text-xs text-destructive hover:bg-destructive/10"
          >
            <Unlink className="size-3.5" />
            Disconnect
          </Button>
        </div>
      </div>

      {loadingTweets && !tweets ? (
        <div className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 size-5 animate-spin text-primary" />
          Reading your recent posts…
        </div>
      ) : tweets && tweets.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {tweets.map((tweet) => (
            <Card key={tweet.id} size="sm" className="gap-3 p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{tweet.text}</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border/60 pt-2.5 text-xs text-muted-foreground">
                <Stat icon={<Eye className="size-3.5" />} value={tweet.metrics.views} />
                <Stat icon={<Heart className="size-3.5" />} value={tweet.metrics.likes} />
                <Stat icon={<MessageCircle className="size-3.5" />} value={tweet.metrics.replies} />
                <Stat icon={<Repeat2 className="size-3.5" />} value={tweet.metrics.reposts} />
                {tweet.createdAt && (
                  <span className="ml-auto">{new Date(tweet.createdAt).toLocaleDateString()}</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Placeholder
          title="No recent posts found"
          body="Post on X and refresh — your tweets and their real metrics will show up here."
        />
      )}
    </div>
  );
}

function Stat({ icon, value }: { icon: React.ReactNode; value: number }) {
  return (
    <span className="inline-flex items-center gap-1">
      {icon}
      {formatCount(value)}
    </span>
  );
}

function Placeholder({ title, body }: { title: string; body: string }) {
  return (
    <Card className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-2xl border-dashed p-8 text-center">
      <Link2 className="size-6 text-muted-foreground/40" />
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="max-w-sm text-sm text-muted-foreground">{body}</p>
      </div>
    </Card>
  );
}
