/**
 * Validated server environment access. Importing this module fails loudly at
 * startup if a required variable is missing, rather than mid-request.
 *
 * Server-only — do not import from client components (the secrets here are not
 * exposed to the browser). X credentials are added in Phase 3.
 */

import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.url(),
  BETTER_AUTH_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(1),
  NVIDIA_API_KEY: z.string().min(1),
  // Optional: enables "Connect with X" (read-only). Absent → the journey stays
  // a placeholder and the app boots fine either way.
  X_CLIENT_ID: z.string().optional(),
  X_CLIENT_SECRET: z.string().optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const missing = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
  throw new Error(`Invalid or missing environment variables: ${missing}`);
}

export const env = parsed.data;
