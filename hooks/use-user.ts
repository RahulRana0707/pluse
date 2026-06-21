import { authClient } from "@/lib/auth-client";

export function useUser() {
  const { data, isPending, error } = authClient.useSession();

  const isLoading = isPending;
  const isAuthenticated = !!data;
  const isSessionBroken = !isPending && !data;

  let status: "loading" | "authenticated" | "unauthenticated" = "loading";
  if (!isPending) {
    status = data ? "authenticated" : "unauthenticated";
  }

  return {
    user: data?.user ?? null,
    session: data?.session ?? null,
    isLoading,
    isAuthenticated,
    isSessionBroken,
    status,
    error,
  };
}
