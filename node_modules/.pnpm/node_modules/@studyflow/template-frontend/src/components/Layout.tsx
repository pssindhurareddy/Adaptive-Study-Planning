import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  CheckSquare,
  LayoutDashboard,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import type { ReactNode } from "react";

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  ocid: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard size={16} />,
    ocid: "nav-dashboard",
  },
  {
    to: "/tasks",
    label: "Tasks",
    icon: <CheckSquare size={16} />,
    ocid: "nav-tasks",
  },
  {
    to: "/analytics",
    label: "Analytics",
    icon: <BarChart3 size={16} />,
    ocid: "nav-analytics",
  },
];

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { theme, setTheme } = useTheme();

  const isDark = theme === "dark";

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: isDark ? "#0f1117" : "#f9fafb" }}
    >
      {/* Sidebar */}
      <aside
        className="w-56 flex-shrink-0 flex flex-col"
        style={{
          background: isDark ? "#16191f" : "#ffffff",
          borderRight: `1px solid ${isDark ? "#2a2d35" : "#e5e7eb"}`,
        }}
        data-ocid="sidebar"
      >
        {/* Logo + theme toggle */}
        <div
          className="px-5 py-4 flex items-center justify-between"
          style={{
            borderBottom: `1px solid ${isDark ? "#2a2d35" : "#e5e7eb"}`,
          }}
        >
          <p
            className="font-bold text-base leading-tight"
            style={{ color: isDark ? "#f3f4f6" : "#111827" }}
          >
            StudyFlow
          </p>
          <button
            type="button"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="flex items-center justify-center w-7 h-7 rounded transition-colors"
            style={{
              background: isDark ? "#2a2d35" : "#f3f4f6",
              color: isDark ? "#9ca3af" : "#6b7280",
              border: "none",
            }}
            aria-label="Toggle theme"
            data-ocid="theme-toggle"
          >
            {isDark ? <Sun size={13} /> : <Moon size={13} />}
          </button>
        </div>

        {/* Nav section label */}
        <div className="px-4 pt-4 pb-1">
          <span
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: isDark ? "#4b5563" : "#9ca3af" }}
          >
            Pages
          </span>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-3 pb-4 space-y-0.5" data-ocid="nav-links">
          {NAV_ITEMS.map((item) => {
            const isActive =
              currentPath === item.to ||
              (currentPath === "/" && item.to === "/dashboard");

            return (
              <Link
                key={item.to}
                to={item.to}
                data-ocid={item.ocid}
                className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium outline-none transition-colors"
                style={{
                  backgroundColor: isActive ? "#2563eb" : "transparent",
                  color: isActive ? "#ffffff" : isDark ? "#d1d5db" : "#374151",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (
                      e.currentTarget as HTMLAnchorElement
                    ).style.backgroundColor = isDark ? "#2a2d35" : "#f3f4f6";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (
                      e.currentTarget as HTMLAnchorElement
                    ).style.backgroundColor = "transparent";
                  }
                }}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div
          className="flex-1 overflow-y-auto"
          style={{ background: isDark ? "#0f1117" : "#f9fafb" }}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
