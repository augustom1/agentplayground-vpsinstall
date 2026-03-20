"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FlaskConical,
  MessageSquare,
  Users,
  Building2,
  Bot,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/playground", label: "Playground", icon: FlaskConical },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/teams", label: "Agent Teams", icon: Users },
  { href: "/clients", label: "Clients", icon: Building2 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{ backgroundColor: "#111118", borderRight: "1px solid #2a2a3a", width: "220px" }}
      className="flex flex-col min-h-screen shrink-0"
    >
      {/* Logo */}
      <div
        style={{ borderBottom: "1px solid #2a2a3a" }}
        className="flex items-center gap-2 px-5 py-5"
      >
        <div
          style={{ backgroundColor: "#6366f1", borderRadius: "8px" }}
          className="flex items-center justify-center w-8 h-8"
        >
          <Bot size={16} color="white" />
        </div>
        <span className="font-semibold text-sm" style={{ color: "#e2e2f0" }}>
          Agent Dashboard
        </span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 p-3 flex-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              style={{
                backgroundColor: active ? "rgba(99,102,241,0.15)" : "transparent",
                color: active ? "#a5b4fc" : "#6b7280",
                borderRadius: "8px",
                border: active ? "1px solid rgba(99,102,241,0.25)" : "1px solid transparent",
              }}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors",
                "hover:bg-white/5 hover:text-gray-200"
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ borderTop: "1px solid #2a2a3a" }} className="p-3">
        <Link
          href="/settings"
          style={{ color: "#6b7280", borderRadius: "8px" }}
          className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium hover:bg-white/5 hover:text-gray-200 transition-colors"
        >
          <Settings size={16} />
          Settings
        </Link>
      </div>
    </aside>
  );
}
