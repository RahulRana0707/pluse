"use client";

import { usePathname } from "next/navigation";

export interface BreadcrumbItemType {
  title: string;
  url: string;
  isPage: boolean;
}

const moduleNames: Record<string, string> = {
  dashboard: "Pulse",
  opportunities: "Opportunity Feed",
  patterns: "Pattern Library",
  hooks: "Hook Intelligence",
  analyzer: "Tweet Analyzer",
  ideas: "Idea Engine",
  "content-os": "Content OS",
};

export function useBreadcrumbs(): BreadcrumbItemType[] {
  const pathname = usePathname() || "";
  const segments = pathname.split("/").filter(Boolean);

  return segments.map((segment, index) => {
    const url = "/" + segments.slice(0, index + 1).join("/");
    const isPage = index === segments.length - 1;
    const title = moduleNames[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    return { title, url, isPage };
  });
}
