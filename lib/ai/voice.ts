/**
 * One voice fingerprint, reused everywhere. Feature modules append
 * voicePromptBlock(profile) to their prompts so ideas, hooks, analyzer
 * rewrites, and opportunity angles all come back in the creator's voice
 * instead of being re-specified per feature.
 */

export interface VoiceProfile {
  about?: string | null;
  pillars?: string | null;
  audience?: string | null;
  tone?: string | null;
  goal?: string | null;
  voiceSamples?: string | null;
}

const VOICE_SAMPLE_LIMIT = 10;

/** Pasted voice-seed posts as a clean array. */
export function voiceSampleList(profile?: VoiceProfile | null): string[] {
  return (profile?.voiceSamples ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, VOICE_SAMPLE_LIMIT);
}

export function hasVoice(profile?: VoiceProfile | null): boolean {
  if (!profile) return false;
  return [profile.about, profile.pillars, profile.audience, profile.tone, profile.goal, profile.voiceSamples].some(
    (v) => (v ?? "").trim(),
  );
}

/**
 * A trailing context block appended AFTER a feature's base prompt — the base
 * prompt keeps the task keyword up front (so PulseAI task routing is unaffected)
 * and this adds the creator's voice as context. Returns "" when no profile is set.
 */
export function voicePromptBlock(profile?: VoiceProfile | null): string {
  if (!hasVoice(profile)) return "";

  const fields = [
    profile!.about && `About the creator: ${profile!.about}`,
    profile!.pillars && `Content pillars: ${profile!.pillars}`,
    profile!.audience && `Audience: ${profile!.audience}`,
    profile!.tone && `Tone/voice: ${profile!.tone}`,
    profile!.goal && `Goal: ${profile!.goal}`,
  ].filter(Boolean);

  const samples = voiceSampleList(profile);
  const sampleBlock = samples.length
    ? `\nExample posts in the creator's voice (match this style, do not copy):\n${samples.map((s) => `- ${s}`).join("\n")}`
    : "";

  return `

## Creator voice fingerprint
Write in this creator's voice and serve their strategy. Where this conflicts with explicit parameters above, the explicit parameters win.
${fields.join("\n")}${sampleBlock}`;
}
