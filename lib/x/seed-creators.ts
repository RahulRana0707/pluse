export interface SeedCreator {
  handle: string; // without @
  name: string;
  tweetIds: string[];
}

/**
 * The single default creator shipped with the app. Everyone else is added by
 * the user. This one tweet id is validated-live and renders for free via the
 * syndication CDN, so there's instant content with no API key.
 */
export const SEED_CREATORS: SeedCreator[] = [
  { handle: "IndieHackers", name: "Indie Hackers", tweetIds: ["1909662310907757003"] },
];
