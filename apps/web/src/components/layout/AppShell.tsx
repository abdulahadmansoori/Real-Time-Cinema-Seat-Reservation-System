"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { useTheme } from "@/features/theme/ThemeProvider";
import { cn } from "@/lib/cn";
import { useSocketConnected } from "@/lib/socket";
import { Modal } from "@/components/ui/Modal";

type NavItem = {
  href: string;
  label: string;
  adminOnly?: boolean;
  section?: "general" | "account";
  icon: "grid" | "seats" | "ticket" | "activity" | "users" | "sim" | "book";
  badge?: string;
};

const nav: NavItem[] = [
  { href: "/", label: "Book seats", section: "general", icon: "seats" },
  {
    href: "/reservations",
    label: "My reservations",
    section: "general",
    icon: "ticket",
  },
  { href: "/activity", label: "My activity", section: "general", icon: "activity" },
  {
    href: "/admin",
    label: "Dashboard",
    adminOnly: true,
    section: "general",
    icon: "grid",
  },
  {
    href: "/admin/reservations",
    label: "Reservations",
    adminOnly: true,
    section: "general",
    icon: "ticket",
  },
  {
    href: "/admin/activity",
    label: "Activity logs",
    adminOnly: true,
    section: "general",
    icon: "activity",
    badge: "02",
  },
  {
    href: "/admin/users",
    label: "Manage users",
    adminOnly: true,
    section: "account",
    icon: "users",
  },
  {
    href: "/admin/simulation",
    label: "Simulation",
    adminOnly: true,
    section: "account",
    icon: "sim",
  },
];

function NavIcon({ type }: { type: NavItem["icon"] | "logout" | "menu" }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (type) {
    case "grid":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      );
    case "seats":
      return (
        <svg {...common}>
          <path d="M4 10h16v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7Z" />
          <path d="M6 10V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3" />
          <path d="M8 19v2M16 19v2" />
        </svg>
      );
    case "ticket":
      return (
        <svg {...common}>
          <path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V9Z" />
          <path d="M9 7v10" />
        </svg>
      );
    case "activity":
      return (
        <svg {...common}>
          <path d="M12 2l2.2 6.6H21l-5.4 3.9 2.1 6.5L12 15.8 6.3 19l2.1-6.5L3 8.6h6.8L12 2Z" />
        </svg>
      );
    case "users":
      return (
        <svg {...common}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "sim":
      return (
        <svg {...common}>
          <path d="M4 19V5M10 19V9M16 19V3M22 19v-8" />
        </svg>
      );
    case "book":
      return (
        <svg {...common}>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
        </svg>
      );
    case "logout":
      return (
        <svg {...common}>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      );
    case "menu":
      return (
        <svg {...common}>
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="18" x2="20" y2="18" />
        </svg>
      );
    default:
      return null;
  }
}

export function AppShell({
  children,
  title,
  subtitle,
  actions,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const socketConnected = useSocketConnected();
  const [collapsed, setCollapsed] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const isAdmin = user?.role === "ADMIN";
  const visible = nav.filter((n) => !n.adminOnly || isAdmin);
  const general = visible.filter((n) => n.section !== "account");
  const account = visible.filter((n) => n.section === "account");

  return (
    <div className={cn("shell", collapsed && "collapsed")}>
      <aside className={cn("sidebar", collapsed && "is-collapsed")}>
        <div className="brand-row">
          <div className="logo" aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 6h16v12H4z" opacity="0.2" />
              <path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2h-2a1 1 0 0 0 0 2h2v2h-2a1 1 0 0 0 0 2h2v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2h2a1 1 0 0 0 0-2H3v-2h2a1 1 0 0 0 0-2H3V7Z" />
            </svg>
          </div>
          {!collapsed ? <span className="brand">cinema</span> : null}
          <button
            type="button"
            className="menu-btn"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <NavIcon type="menu" />
          </button>
        </div>

        {!collapsed ? <p className="section">General</p> : <div className="rail-divider" />}
        <nav className="nav-list">
          {general.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn("nav-item", pathname === item.href && "active")}
              title={item.label}
            >
              <span className="nav-icon">
                <NavIcon type={item.icon} />
              </span>
              <span className="nav-label">{item.label}</span>
              {item.badge ? <span className="badge">{item.badge}</span> : null}
            </Link>
          ))}
        </nav>

        {account.length > 0 ? (
          <>
            {!collapsed ? (
              <p className="section">Account</p>
            ) : (
              <div className="rail-divider" />
            )}
            <nav className="nav-list">
              {account.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn("nav-item", pathname === item.href && "active")}
                  title={item.label}
                >
                  <span className="nav-icon">
                    <NavIcon type={item.icon} />
                  </span>
                  <span className="nav-label">{item.label}</span>
                </Link>
              ))}
            </nav>
          </>
        ) : null}

        <div className="spacer" />
        <button
          className="logout"
          onClick={() => setLogoutOpen(true)}
          type="button"
          title="Logout"
        >
          <span className="nav-icon">
            <NavIcon type="logout" />
          </span>
          <span className="nav-label">Logout</span>
        </button>
      </aside>

      <Modal
        open={logoutOpen}
        title="Sign out?"
        confirmLabel="Logout"
        cancelLabel="Stay signed in"
        danger
        onClose={() => setLogoutOpen(false)}
        onConfirm={() => {
          setLogoutOpen(false);
          logout();
          router.replace("/login");
        }}
      >
        You’ll need to sign in again to reserve seats or manage bookings.
      </Modal>

      <div className="main">
        <header className="topbar">
          <label className="search">
            <span className="search-icon" aria-hidden>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </span>
            <input type="search" placeholder="Search" aria-label="Search" />
          </label>

          <div className="actions">
            <span
              className={cn("icon-btn socket-status", socketConnected ? "online" : "offline")}
              title={socketConnected ? "Live updates connected" : "Live updates disconnected"}
              aria-label={socketConnected ? "Socket connected" : "Socket disconnected"}
              role="status"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M5 12.5a7 7 0 0 1 14 0" />
                <path d="M8.5 15.5a3.5 3.5 0 0 1 7 0" />
                <circle cx="12" cy="19" r="1.25" fill="currentColor" stroke="none" />
              </svg>
              <span className="socket-dot" aria-hidden />
            </span>
            <button
              type="button"
              className="icon-btn"
              title="Toggle fullscreen"
              aria-label="Toggle fullscreen"
              onClick={() => {
                if (!document.fullscreenElement) {
                  void document.documentElement.requestFullscreen?.();
                } else {
                  void document.exitFullscreen?.();
                }
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" />
              </svg>
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={toggle}
              title="Toggle theme"
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5Z" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                </svg>
              )}
            </button>
            <div className="avatar" title={user?.email} aria-label={user?.email}>
              {(user?.email?.[0] ?? "U").toUpperCase()}
            </div>
          </div>
        </header>

        <div className="page-head">
          <div className="page-head-text">
            <h1>{title ?? "Cinema"}</h1>
            {subtitle ? <p className="sub">{subtitle}</p> : null}
          </div>
          {actions ? <div className="page-head-actions">{actions}</div> : null}
        </div>
        <main className="content">{children}</main>
      </div>

      <style jsx>{`
        .shell {
          display: grid;
          grid-template-columns: 248px 1fr;
          height: 100vh;
          max-height: 100vh;
          overflow: hidden;
          transition: grid-template-columns 0.2s ease;
        }
        .shell.collapsed {
          grid-template-columns: 72px 1fr;
        }
        .sidebar {
          background: var(--sidebar);
          color: var(--sidebar-text);
          padding: 1.1rem 0.75rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          border-right: 1px solid var(--sidebar-border);
          height: 100vh;
          max-height: 100vh;
          overflow-x: hidden;
          overflow-y: auto;
          position: sticky;
          top: 0;
          align-self: start;
        }
        .brand-row {
          display: flex;
          align-items: center;
          gap: 0.55rem;
          margin-bottom: 1.1rem;
          padding: 0 0.2rem;
          min-height: 36px;
        }
        .logo {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          background: var(--accent);
          color: #fff;
          flex-shrink: 0;
        }
        .brand {
          flex: 1;
          font-size: 1.15rem;
          font-weight: 700;
          letter-spacing: -0.03em;
          text-transform: lowercase;
          white-space: nowrap;
          min-width: 0;
        }
        .menu-btn {
          border: none;
          background: transparent;
          color: #9ca3af;
          width: 34px;
          height: 34px;
          border-radius: 8px;
          display: grid;
          place-items: center;
          cursor: pointer;
          flex-shrink: 0;
          margin-left: auto;
        }
        .menu-btn:hover {
          background: var(--sidebar-hover);
          color: #fff;
        }
        .section {
          margin: 0.85rem 0 0.4rem;
          padding: 0 0.65rem;
          font-size: 0.68rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--sidebar-muted);
          font-weight: 600;
        }
        .rail-divider {
          height: 1px;
          margin: 0.65rem 0.55rem;
          background: var(--sidebar-border);
        }
        .nav-list {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }
        :global(.nav-item),
        .logout {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          padding: 0.7rem 0.75rem;
          border-radius: 10px;
          color: var(--sidebar-text);
          opacity: 0.9;
          font-size: 0.92rem;
          border: none;
          background: transparent;
          cursor: pointer;
          text-align: left;
          text-decoration: none;
        }
        :global(.nav-item:hover),
        .logout:hover {
          background: var(--sidebar-hover);
          opacity: 1;
        }
        :global(.nav-item.active) {
          background: var(--sidebar-active);
          opacity: 1;
          font-weight: 600;
        }
        .nav-icon {
          width: 20px;
          height: 20px;
          display: grid;
          place-items: center;
          color: #d1d5db;
          flex-shrink: 0;
        }
        :global(.nav-item.active) .nav-icon {
          color: #fff;
        }
        .nav-label {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .badge {
          background: var(--accent);
          color: #fff;
          font-size: 0.68rem;
          font-weight: 700;
          border-radius: 999px;
          padding: 0.12rem 0.45rem;
          min-width: 1.5rem;
          text-align: center;
        }
        .spacer {
          flex: 1;
        }
        .logout {
          margin-top: 0.5rem;
        }

        /* Collapsed icon rail */
        .sidebar.is-collapsed {
          padding: 0.9rem 0.45rem 0.85rem;
          align-items: center;
        }
        .sidebar.is-collapsed .brand-row {
          flex-direction: column;
          gap: 0.45rem;
          margin-bottom: 0.85rem;
          padding: 0;
        }
        .sidebar.is-collapsed .menu-btn {
          margin-left: 0;
        }
        .sidebar.is-collapsed .nav-label,
        .sidebar.is-collapsed .badge {
          display: none;
        }
        .sidebar.is-collapsed .nav-list {
          width: 100%;
          align-items: center;
        }
        .sidebar.is-collapsed :global(.nav-item),
        .sidebar.is-collapsed .logout {
          justify-content: center;
          width: 44px;
          height: 44px;
          padding: 0;
          margin: 0 auto 0.2rem;
          gap: 0;
        }
        .sidebar.is-collapsed .nav-icon {
          width: 20px;
          margin: 0;
        }
        .sidebar.is-collapsed .spacer {
          width: 100%;
        }
        .main {
          display: flex;
          flex-direction: column;
          min-width: 0;
          min-height: 0;
          height: 100vh;
          max-height: 100vh;
          overflow-x: hidden;
          overflow-y: auto;
          background: var(--bg);
        }
        .topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          padding: 0.9rem 1.5rem;
          border-bottom: 1px solid var(--border);
          background: var(--topbar-bg);
          position: sticky;
          top: 0;
          z-index: 5;
          flex-shrink: 0;
        }
        .search {
          display: flex;
          align-items: center;
          gap: 0.55rem;
          width: min(340px, 42%);
          background: var(--search-bg);
          border: 1px solid transparent;
          border-radius: 999px;
          padding: 0.55rem 0.95rem;
          color: var(--text-muted);
        }
        .search-icon {
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }
        .search input {
          border: none;
          outline: none;
          background: transparent;
          width: 100%;
          color: var(--text);
          font-size: 0.9rem;
        }
        .search input::placeholder {
          color: var(--text-muted);
        }
        .actions {
          display: flex;
          gap: 0.55rem;
          align-items: center;
        }
        .icon-btn {
          width: 40px;
          height: 40px;
          border-radius: 999px;
          border: 1px solid var(--border);
          background: var(--icon-btn-bg);
          color: var(--icon-btn-color);
          display: grid;
          place-items: center;
          cursor: pointer;
          box-shadow: var(--shadow);
        }
        .icon-btn:hover {
          background: var(--bg-muted);
        }
        .socket-status {
          position: relative;
          cursor: default;
        }
        .socket-status.online {
          color: var(--accent);
        }
        .socket-status.offline {
          color: var(--danger);
          opacity: 0.85;
        }
        .socket-dot {
          position: absolute;
          right: 8px;
          bottom: 8px;
          width: 7px;
          height: 7px;
          border-radius: 999px;
          border: 1.5px solid var(--icon-btn-bg);
          background: var(--danger);
        }
        .socket-status.online .socket-dot {
          background: var(--accent);
        }
        .avatar {
          width: 40px;
          height: 40px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background: var(--avatar-bg);
          color: var(--avatar-color);
          font-weight: 700;
          font-size: 0.9rem;
        }
        .page-head {
          padding: 1.15rem 1.5rem 0;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
        }
        .page-head-text {
          min-width: 0;
        }
        .page-head h1 {
          margin: 0;
          font-size: 1.45rem;
          letter-spacing: -0.02em;
        }
        .sub {
          margin: 0.25rem 0 0;
          color: var(--text-muted);
          font-size: 0.9rem;
        }
        .page-head-actions {
          display: flex;
          align-items: center;
          gap: 0.55rem;
          flex-shrink: 0;
        }
        .content {
          padding: 1rem 1.5rem 2rem;
        }
        @media (max-width: 900px) {
          .shell,
          .shell.collapsed {
            grid-template-columns: 1fr;
            height: auto;
            max-height: none;
            overflow: visible;
          }
          .sidebar {
            position: sticky;
            top: 0;
            z-index: 20;
            height: auto;
            max-height: none;
            overflow: visible;
          }
          .main {
            height: auto;
            max-height: none;
            overflow: visible;
          }
          .search {
            width: 100%;
            max-width: 180px;
          }
        }
      `}</style>
    </div>
  );
}
