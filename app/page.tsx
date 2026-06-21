import Image from "next/image";
import Link from "next/link";
import { ModeToggle } from "@/components/theme-toggler";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";

export default function Home() {
  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col bg-background text-foreground select-none">
      {/* Background Image */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Image
          src="/landing-background.png"
          alt="Landing Background"
          fill
          priority
          className="object-cover opacity-90 dark:opacity-70"
        />
      </div>

      {/* Dynamic Smoke/Cloud light effect from the bottom */}
      <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-[85%] h-1/3 rounded-full bg-primary/10 dark:bg-primary/5 blur-[120px] pointer-events-none z-10" />
      <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-background via-background/40 to-transparent pointer-events-none z-10" />

      {/* Floating Header */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-4xl px-6 py-3 rounded-full border border-border bg-background/40 backdrop-blur-md flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <Icons.logo className="size-12" />
          <span className="text-xl font-bold tracking-tight text-foreground">
            Pulse
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
          >
            Sign In
          </Link>
          <ModeToggle />
        </div>
      </div>

      {/* Main Content (centered directly on the background, no container card) */}
      <main className="relative z-20 flex-1 flex flex-col items-center justify-center text-center px-4 max-w-3xl mx-auto gap-8 mt-16">
        <div className="flex flex-col gap-4">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight text-foreground">
            See attention before everyone else.
          </h1>
          <p className="text-lg md:text-xl text-foreground max-w-xl mx-auto leading-relaxed">
            Pulse helps creators discover trends, analyze viral frameworks, and
            optimize hook retention before publishing.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link href="/signup">
            <Button
              variant="default"
              className="active-scale w-full sm:w-auto h-12 px-8 font-semibold rounded-xl"
            >
              Get Started
            </Button>
          </Link>
          <Link href="/login">
            <Button
              variant="outline"
              className="active-scale w-full sm:w-auto h-12 px-8 font-semibold"
            >
              Sign In
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 px-8 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Pulse. All rights reserved.
      </footer>
    </div>
  );
}
