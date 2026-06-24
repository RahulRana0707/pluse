"use client"

import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import { Icons } from "@/components/icons"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  LayoutDashboard,
  Sparkles,
  Library,
  Flame,
  LineChart,
  Lightbulb,
  Layers,
  FileText,
  Settings2,
  CalendarDays,
} from "lucide-react"

// Pulse platform module definitions
const data = {
  teams: [
    {
      name: "Pulse",
      logo: <Icons.logo className="size-full" />,
      plan: "Attention OS",
    },
  ],
  navMain: [
    {
      title: "Command Center",
      url: "/dashboard",
      icon: <LayoutDashboard />,
      isActive: true,
    },
    {
      title: "Inspiration",
      url: "/dashboard/inspiration",
      icon: <Sparkles />,
    },
    {
      title: "Daily Posts",
      url: "/dashboard/daily",
      icon: <CalendarDays />,
    },
    {
      title: "Idea Engine",
      url: "/dashboard/ideas",
      icon: <Lightbulb />,
    },
    {
      title: "Hook Intelligence",
      url: "/dashboard/hooks",
      icon: <Flame />,
    },
    {
      title: "Tweet Analyzer",
      url: "/dashboard/analyzer",
      icon: <LineChart />,
    },
    {
      title: "Pattern Library",
      url: "/dashboard/patterns",
      icon: <Library />,
    },
    {
      title: "Content OS",
      url: "/dashboard/content-os",
      icon: <Layers />,
    },
    {
      title: "Articles",
      url: "/dashboard/articles",
      icon: <FileText />,
    },
    {
      title: "Settings",
      url: "#",
      icon: <Settings2 />,
      items: [
        {
          title: "Account",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
