"use client";

import type { ReactNode } from "react";
import { useTweet, enrichTweet, formatDate, type EnrichedTweet } from "react-tweet";
import { BadgeCheck, Heart, MessageCircle, Play, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

/**
 * Renders a saved tweet in the app's own card design. Tweet data is fetched
 * from the free syndication CDN (no API key) via react-tweet's data hook; the
 * visual layer is ours so it stays consistent with the rest of the dashboard.
 * `actions` is an optional overlay (remix, remove) shown top-right.
 */
export function TweetCard({ id, actions }: { id: string; actions?: ReactNode }) {
  const { data, error, isLoading } = useTweet(id);

  if (isLoading) return <TweetCardShell actions={actions}><TweetSkeleton /></TweetCardShell>;
  if (error || !data) return <TweetCardShell actions={actions}><TweetUnavailable id={id} /></TweetCardShell>;

  const tweet = enrichTweet(data);

  return (
    <TweetCardShell actions={actions}>
      <div className="flex flex-col gap-3">
        <TweetAuthor tweet={tweet} />
        <TweetBody tweet={tweet} />
        <TweetMedia tweet={tweet} />
        <TweetFooter tweet={tweet} />
      </div>
    </TweetCardShell>
  );
}

function TweetCardShell({ actions, children }: { actions?: ReactNode; children: ReactNode }) {
  return (
    <Card size="sm" className="relative gap-0 p-4 transition-shadow hover:shadow-md">
      {actions && (
        <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5">{actions}</div>
      )}
      {children}
    </Card>
  );
}

function TweetAuthor({ tweet }: { tweet: EnrichedTweet }) {
  const { user } = tweet;
  return (
    <a
      href={user.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2.5 pr-16"
    >
      <Avatar size="lg">
        <AvatarImage src={user.profile_image_url_https} alt={user.name} />
        <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-col">
        <span className="flex items-center gap-1 text-sm font-semibold text-foreground">
          <span className="truncate">{user.name}</span>
          {(user.is_blue_verified || user.verified) && (
            <BadgeCheck className="size-4 shrink-0 fill-primary text-card" />
          )}
        </span>
        <span className="truncate text-xs text-muted-foreground">@{user.screen_name}</span>
      </div>
    </a>
  );
}

function TweetBody({ tweet }: { tweet: EnrichedTweet }) {
  return (
    <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
      {tweet.entities.map((entity, i) => {
        if (entity.type === "media") return null;
        if (entity.type === "text")
          return <span key={i} dangerouslySetInnerHTML={{ __html: entity.text }} />;
        return (
          <a
            key={i}
            href={entity.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {entity.text}
          </a>
        );
      })}
    </p>
  );
}

function TweetMedia({ tweet }: { tweet: EnrichedTweet }) {
  if (tweet.video) {
    return (
      <a
        href={tweet.url}
        target="_blank"
        rel="noopener noreferrer"
        className="relative block overflow-hidden rounded-xl border border-border"
      >
        <img src={tweet.video.poster} alt="" loading="lazy" className="w-full object-cover" />
        <span className="absolute inset-0 flex items-center justify-center bg-black/10">
          <span className="flex size-12 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm">
            <Play className="size-5 fill-foreground text-foreground" />
          </span>
        </span>
      </a>
    );
  }

  const photos = tweet.photos ?? [];
  if (!photos.length) return null;

  return (
    <div
      className={cn(
        "grid gap-1 overflow-hidden rounded-xl border border-border",
        photos.length > 1 && "grid-cols-2"
      )}
    >
      {photos.map((photo) => (
        <img
          key={photo.url}
          src={photo.url}
          alt=""
          loading="lazy"
          className={cn(
            "w-full object-cover",
            photos.length === 1 ? "max-h-80" : "aspect-square"
          )}
        />
      ))}
    </div>
  );
}

function TweetFooter({ tweet }: { tweet: EnrichedTweet }) {
  return (
    <div className="flex items-center gap-4 border-t border-border/60 pt-2.5 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1">
        <Heart className="size-3.5" />
        {formatCount(tweet.favorite_count)}
      </span>
      <span className="inline-flex items-center gap-1">
        <MessageCircle className="size-3.5" />
        {formatCount(tweet.conversation_count)}
      </span>
      <a
        href={tweet.url}
        target="_blank"
        rel="noopener noreferrer"
        className="ml-auto inline-flex items-center gap-1 hover:text-foreground"
      >
        {formatDate(new Date(tweet.created_at))}
        <ExternalLink className="size-3" />
      </a>
    </div>
  );
}

function TweetSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <div className="size-10 animate-pulse rounded-full bg-muted" />
        <div className="flex flex-col gap-1.5">
          <div className="h-3 w-24 animate-pulse rounded bg-muted" />
          <div className="h-2.5 w-16 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
        <div className="h-3 w-11/12 animate-pulse rounded bg-muted" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}

function TweetUnavailable({ id }: { id: string }) {
  return (
    <a
      href={`https://x.com/i/status/${id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col items-center gap-1.5 py-6 text-center text-xs text-muted-foreground hover:text-foreground"
    >
      <ExternalLink className="size-4" />
      This tweet is unavailable. View on X.
    </a>
  );
}

const formatCount = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : `${n}`;
