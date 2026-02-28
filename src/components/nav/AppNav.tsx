"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Inbox,
  FolderOpen,
  Focus,
  Settings,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/today", label: "Today", icon: LayoutDashboard },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/projects", label: "Projects", icon: FolderOpen },
  { href: "/focus", label: "Focus", icon: Focus },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col w-56 min-h-screen bg-card border-r px-3 py-6 gap-1">
      <div className="flex items-center gap-2 px-2 mb-6">
        <Globe className="h-5 w-5 text-primary" />
        <span className="font-bold text-base">FocusOS</span>
      </div>
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href}>
          <Button
            variant={pathname.startsWith(href) ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start gap-2 h-9 text-sm",
              pathname.startsWith(href) && "font-semibold"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Button>
        </Link>
      ))}
    </aside>
  );
}
