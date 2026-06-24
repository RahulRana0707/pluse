import { reactTweetProvider } from "@/lib/x/providers/react-tweet-provider";
import type { TweetProvider } from "@/lib/x/tweet-provider";

/**
 * Resolves the active tweet provider — the single place that decides the data
 * source. Phase 2 always returns the free render-by-id provider; Phase 5
 * returns a live-search provider when its key is configured. Callers depend
 * only on the TweetProvider interface, so that swap changes nothing else.
 */
export function getProvider(): TweetProvider {
  return reactTweetProvider;
}
