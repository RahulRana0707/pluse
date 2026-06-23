import { getTweet as fetchSyndicatedTweet } from "react-tweet/api";
import type { TweetProvider } from "@/lib/x/tweet-provider";

/**
 * Free, no-key provider. Fetches a single public tweet through the syndication
 * CDN (the same mechanism Twitter embeds use). It cannot list timelines or
 * search — those are paid and arrive in Phase 5 behind the same interface.
 */
export const reactTweetProvider: TweetProvider = {
  async getTweet(id) {
    try {
      const tweet = await fetchSyndicatedTweet(id);
      if (!tweet) return null;
      return {
        id: tweet.id_str,
        url: `https://x.com/${tweet.user.screen_name}/status/${tweet.id_str}`,
        authorHandle: tweet.user.screen_name,
        authorName: tweet.user.name,
        text: tweet.text,
      };
    } catch {
      // Deleted, private, or the undocumented CDN is unavailable — fail soft.
      return null;
    }
  },
};
