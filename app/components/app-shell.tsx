"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { useCandidates } from "../hooks/use-candidates";
import { useNotifications } from "../hooks/use-notifications";
import { usePersistentState } from "../hooks/use-persistent-state";
import { Icons } from "./icons";

const navItems = [
  { label: "Dashboard", href: "/", icon: Icons.grid },
  { label: "Upload CVs", href: "/upload", icon: Icons.upload },
  { label: "Candidates", href: "/candidates", icon: Icons.users },
  { label: "Analytics", href: "/analytics", icon: Icons.chart },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [candidates] = useCandidates();
  const [theme, setTheme] = usePersistentState<"light" | "dark">(
    "talentlens-theme",
    "light",
    { validate: (value): value is "light" | "dark" => value === "light" || value === "dark" },
  );
  const [globalQuery, setGlobalQuery] = usePersistentState(
    "talentlens-candidate-query",
    "",
    { validate: (value): value is string => typeof value === "string" },
  );
  const [notifications, setNotifications] = useNotifications();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === "Escape") setNotificationsOpen(false);
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setNotificationsOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  useEffect(() => {
    function handleStorageFailure() {
      setStorageError(true);
    }

    window.addEventListener("talentlens-storage-error", handleStorageFailure);
    return () =>
      window.removeEventListener(
        "talentlens-storage-error",
        handleStorageFailure,
      );
  }, []);

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    router.push("/candidates");
  }

  const unreadCount = notifications.filter((item) => !item.read).length;

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      {mobileOpen && (
        <button className="sidebar-backdrop" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />
      )}
      <aside className={`sidebar ${mobileOpen ? "is-open" : ""}`}>
        <Link href="/" className="brand" aria-label="TalentLens home" onClick={() => setMobileOpen(false)}>
          <Image className="brand-logo" src="/logo.svg" alt="" width={36} height={36} priority />
          <span>TalentLens</span>
        </Link>

        <nav className="main-nav" aria-label="Primary navigation">
          <span className="nav-label">Workspace</span>
          {navItems.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${active ? "active" : ""}`}
                aria-current={active ? "page" : undefined}
                onClick={() => setMobileOpen(false)}
              >
                <Icon size={19} />
                <span>{item.label}</span>
                {item.label === "Candidates" && <span className="nav-count">{candidates.length}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="usage-card">
            <div className="usage-icon"><Icons.sparkles size={17} /></div>
            <div><strong>Local workspace</strong><span>{candidates.length} candidate profiles</span></div>
            <div className="usage-track"><span style={{ width: `${Math.min(100, candidates.length * 5)}%` }} /></div>
            <Link href="/analytics">View usage</Link>
          </div>
          <Link href="/analytics" className="profile-switcher">
            <span className="avatar avatar-violet">VL</span>
            <span className="profile-copy"><strong>Vigan Labs</strong><small>Recruiting team</small></span>
            <Icons.arrowRight size={16} />
          </Link>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setMobileOpen(true)}>
            <Icons.menu />
          </button>
          <form className="global-search" onSubmit={submitSearch}>
            <Icons.search size={18} />
            <input
              ref={searchRef}
              value={globalQuery}
              onChange={(event) => setGlobalQuery(event.target.value)}
              aria-label="Search candidates"
              placeholder="Search candidates, skills, or roles..."
            />
            <kbd>Ctrl K</kbd>
          </form>
          <div className="topbar-actions">
            <button
              className="icon-button"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              {theme === "light" ? <Icons.moon size={19} /> : <Icons.sun size={19} />}
            </button>
            <div className="notification-wrap" ref={notificationRef}>
              <button
                className="icon-button notification-button"
                aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
                aria-expanded={notificationsOpen}
                aria-controls="notification-panel"
                onClick={() => setNotificationsOpen((open) => !open)}
              >
                <Icons.bell size={19} />
                {unreadCount > 0 && <span />}
              </button>
              {notificationsOpen && (
                <section id="notification-panel" className="notification-panel" aria-label="Notifications">
                  <div className="notification-header">
                    <div><strong>Notifications</strong><span>{unreadCount} unread</span></div>
                    <button onClick={() => setNotifications((items) => items.map((item) => ({ ...item, read: true })))}>Mark all read</button>
                  </div>
                  <div className="notification-list">
                    {notifications.map((item) => (
                      <Link
                        href={item.href}
                        key={item.id}
                        className={`notification-item ${item.read ? "" : "unread"}`}
                        onClick={() => {
                          setNotifications((items) => items.map((entry) => entry.id === item.id ? { ...entry, read: true } : entry));
                          setNotificationsOpen(false);
                        }}
                      >
                        <i />
                        <span><strong>{item.title}</strong><small>{item.detail}</small></span>
                        <Icons.arrowRight size={15} />
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>
            <Link href="/upload" className="button primary topbar-upload"><Icons.plus size={17} />Upload CV</Link>
          </div>
        </header>
        <main id="main-content" className="page-container page-transition" key={pathname}>{children}</main>
        {storageError && (
          <div className="storage-alert" role="alert">
            <span>Local changes could not be saved. Check browser storage permissions or available space.</span>
            <button aria-label="Dismiss storage warning" onClick={() => setStorageError(false)}>
              <Icons.close size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
