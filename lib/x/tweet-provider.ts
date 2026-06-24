/**
 * The X data seam. Every part of the app fetches tweet data through this
 * interface — never a concrete provider — so the data source can be swapped
 * without touching feature code.
 *
 * Phase 2 ships only the free `getTweet` (render a single public tweet by id,
 * no API key). `searchCreators` / `getUserTweets` require a paid or 3rd-party
 * timeline source and are implemented in Phase 5.
 */

export interface TweetData {
  id: string;
  url: string;
  authorHandle: string;
  authorName?: string;
  text?: string;
}

export interface TweetProvider {
  /** Free, no key. Returns null if the tweet is missing/deleted/unavailable. */
  getTweet(id: string): Promise<TweetData | null>;
  /** Paid/3rd-party only (Phase 5). */
  searchCreators?(query: string): Promise<{ handle: string; name?: string }[]>;
  /** Paid/3rd-party only (Phase 5). */
  getUserTweets?(handle: string, limit: number): Promise<TweetData[]>;
}
