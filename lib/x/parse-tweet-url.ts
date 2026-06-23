export interface ParsedTweet {
  handle: string | null;
  tweetId: string;
}

/**
 * Extracts the status id (and handle when present) from an x.com / twitter.com
 * tweet URL, or accepts a bare numeric tweet id. Returns null otherwise.
 */
export function parseTweetUrl(input: string): ParsedTweet | null {
  const trimmed = input.trim();
  if (/^\d+$/.test(trimmed)) return { handle: null, tweetId: trimmed };

  const match = trimmed.match(
    /(?:twitter\.com|x\.com)\/([^/?#]+)\/status(?:es)?\/(\d+)/i,
  );
  if (!match) return null;
  return { handle: match[1], tweetId: match[2] };
}
