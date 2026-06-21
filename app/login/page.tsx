"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Icons } from "@/components/icons";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    await authClient.signIn.email(
      {
        email,
        password,
      },
      {
        onRequest: () => {
          setIsLoading(true);
        },
        onSuccess: () => {
          setIsLoading(false);
          toast.success("Successfully logged in!");
          router.push("/dashboard");
        },
        onError: (ctx) => {
          setIsLoading(false);
          toast.error(ctx.error.message || "Failed to log in");
        },
      }
    );
  };

  const handleSocialLogin = (provider: "google" | "github") => {
    console.log(provider);
    toast.info(`${provider.charAt(0).toUpperCase() + provider.slice(1)} integration triggered. Check the developer console!`);
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-background text-foreground select-none">
      <div className="w-full max-w-md px-4">
        <Card className="border border-border bg-card text-card-foreground shadow-lg rounded-2xl overflow-hidden">
          <CardHeader className="space-y-1 text-center pt-8">
            <div className="flex justify-center mb-3">
              <Icons.logo className="size-16" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Welcome back</CardTitle>
            <CardDescription className="text-muted-foreground">
              Sign in to your Pulse account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <FieldGroup>
                <Field data-disabled={isLoading}>
                  <FieldLabel htmlFor="email">Email Address</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="bg-background border border-input rounded-xl h-10 px-3 text-foreground placeholder-muted-foreground focus-visible:ring-primary"
                  />
                </Field>

                <Field data-disabled={isLoading}>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="bg-background border border-input rounded-xl h-10 px-3 text-foreground placeholder-muted-foreground focus-visible:ring-primary"
                  />
                </Field>
              </FieldGroup>

              <Button
                type="submit"
                disabled={isLoading}
                className="active-scale h-10 w-full font-semibold rounded-xl transition-all duration-150 flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? (
                  <Icons.loader2 className="animate-spin size-4" />
                ) : (
                  "Sign In with Email"
                )}
              </Button>
            </form>

            <div className="relative flex items-center justify-center my-4">
              <div className="absolute w-full border-t border-border" />
              <span className="relative px-3 bg-card text-xs text-muted-foreground uppercase tracking-wider">
                Or continue with
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => handleSocialLogin("google")}
                disabled={isLoading}
                className="active-scale h-10 rounded-xl border border-input bg-background hover:bg-muted text-foreground flex items-center justify-center gap-2 transition-colors duration-150"
              >
                <Icons.google className="size-4" />
                Google
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSocialLogin("github")}
                disabled={isLoading}
                className="active-scale h-10 rounded-xl border border-input bg-background hover:bg-muted text-foreground flex items-center justify-center gap-2 transition-colors duration-150"
              >
                <Icons.gitHub className="size-4" />
                GitHub
              </Button>
            </div>
          </CardContent>

          <CardFooter className="pb-8 pt-4 justify-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-primary font-medium hover:underline ml-1"
            >
              Sign up
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
