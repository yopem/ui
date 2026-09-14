import type { Root } from "fumadocs-core/page-tree"
import type { SortedResult } from "fumadocs-core/search"

import { Button } from "@registry/components/ui/button"
import {
  Dialog,
  DialogPopup,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@registry/components/ui/dialog"
import { Input } from "@registry/components/ui/input"
import { tokens } from "@registry/styles/tokens.stylex"
import { useTheme } from "@registry/theme/theme-provider"
import * as stylex from "@stylexjs/stylex"
import { Link, useLocation } from "@tanstack/react-router"
import { MenuIcon, SearchIcon } from "lucide-react"
import { useEffect, useRef, useState, type ReactNode } from "react"

import { catalog } from "./components"

const tree: Root = {
  name: "Yopem UI",
  children: [
    { type: "separator", name: "Start here" },
    { type: "page", name: "Introduction", url: "/" },
    { type: "page", name: "Getting started", url: "/docs/getting-started" },
    { type: "page", name: "Installation", url: "/docs/installation" },
    { type: "page", name: "Theming", url: "/docs/theming" },
    { type: "page", name: "Components", url: "/components" },
    { type: "separator", name: "Components" },
    ...catalog.map((item) => ({
      type: "page" as const,
      name: item.title,
      url: `/components/${item.slug}`,
    })),
  ],
}

const styles = stylex.create({
  shell: {
    backgroundColor: tokens["--background"],
    color: tokens["--foreground"],
    fontFamily: tokens["--font-sans"],
    minBlockSize: "100dvh",
    fontSize: "0.875rem",
    lineHeight: 1.5,
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    blockSize: "4rem",
    paddingInline: { default: "2rem", "@media (max-width: 767px)": "1rem" },
    borderBlockEnd: `1px solid ${tokens["--border"]}`,
    backgroundColor: tokens["--background"],
    position: "sticky",
    insetBlockStart: 0,
    zIndex: 20,
  },
  brand: {
    color: tokens["--foreground"],
    fontFamily: tokens["--font-heading"],
    fontWeight: 700,
    fontSize: "1.125rem",
    letterSpacing: "-0.04em",
    textDecoration: "none",
    whiteSpace: "nowrap",
    ":focus-visible": {
      outline: `2px solid ${tokens["--ring"]}`,
      outlineOffset: 4,
    },
  },
  edition: {
    color: tokens["--muted-foreground"],
    fontFamily: tokens["--font-mono"],
    fontSize: "0.6875rem",
    letterSpacing: "0.04em",
    display: { default: "inline", "@media (max-width: 639px)": "none" },
  },
  search: {
    marginInlineStart: "auto",
    inlineSize: { default: "15rem", "@media (max-width: 639px)": "auto" },
    justifyContent: "flex-start",
    color: tokens["--muted-foreground"],
  },
  shortcut: {
    marginInlineStart: "auto",
    fontFamily: tokens["--font-mono"],
    fontSize: "0.6875rem",
    display: { default: "inline", "@media (max-width: 639px)": "none" },
  },
  mobile: {
    display: { default: "none", "@media (max-width: 767px)": "inline-flex" },
  },
  frame: {
    display: "grid",
    gridTemplateColumns: {
      default: "15rem minmax(0, 1fr)",
      "@media (max-width: 767px)": "minmax(0, 1fr)",
    },
    maxInlineSize: "100rem",
    marginInline: "auto",
  },
  sidebar: {
    display: { default: "flex", "@media (max-width: 767px)": "none" },
    flexDirection: "column",
    borderInlineEnd: `1px solid ${tokens["--border"]}`,
    blockSize: "calc(100dvh - 4rem)",
    position: "sticky",
    insetBlockStart: "4rem",
  },
  nav: { overflowY: "auto", padding: "1.25rem", flex: 1 },
  list: { listStyleType: "none", padding: 0, margin: 0 },
  group: {
    color: tokens["--muted-foreground"],
    fontSize: "0.6875rem",
    fontWeight: 600,
    letterSpacing: "0.075em",
    textTransform: "uppercase",
    paddingInline: "0.75rem",
    paddingBlock: "1.25rem 0.625rem",
  },
  navLink: {
    display: "block",
    color: tokens["--muted-foreground"],
    paddingBlock: "0.5rem",
    paddingInline: "0.75rem",
    borderRadius: tokens["--radius-md"],
    textDecoration: "none",
    fontSize: "0.8125rem",
    ":hover": {
      backgroundColor: tokens["--sidebar-accent"],
      color: tokens["--sidebar-accent-foreground"],
    },
    ":focus-visible": {
      outline: `2px solid ${tokens["--ring"]}`,
      outlineOffset: 2,
    },
  },
  active: {
    backgroundColor: tokens["--sidebar-accent"],
    color: tokens["--sidebar-accent-foreground"],
    fontWeight: 600,
  },
  theme: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1rem",
    padding: "1rem 1.5rem",
    borderBlockStart: `1px solid ${tokens["--border"]}`,
    color: tokens["--muted-foreground"],
    fontSize: "0.8125rem",
  },
  select: {
    backgroundColor: tokens["--background"],
    color: tokens["--foreground"],
    borderColor: tokens["--border"],
    borderStyle: "solid",
    borderWidth: 1,
    borderRadius: tokens["--radius-md"],
    padding: "0.5rem",
    fontFamily: tokens["--font-sans"],
    fontSize: "0.8125rem",
    minBlockSize: "2.75rem",
    ":focus-visible": {
      outline: `2px solid ${tokens["--ring"]}`,
      outlineOffset: 2,
    },
  },
  main: { minInlineSize: 0, outline: "none" },
  skip: {
    position: "fixed",
    insetBlockStart: "0.5rem",
    insetInlineStart: "1rem",
    zIndex: 60,
    padding: "0.75rem 1rem",
    backgroundColor: tokens["--primary"],
    color: tokens["--primary-foreground"],
    borderRadius: tokens["--radius-md"],
    transform: "translateY(-200%)",
    ":focus": { transform: "translateY(0)" },
  },
  popup: { padding: "1.5rem", gap: "1rem", maxBlockSize: "min(42rem, 85dvh)" },
  results: {
    listStyleType: "none",
    margin: 0,
    padding: 0,
    overflowY: "auto",
    minBlockSize: 0,
  },
  result: {
    display: "block",
    padding: "0.875rem",
    textDecoration: "none",
    color: tokens["--foreground"],
    borderRadius: tokens["--radius-md"],
    ":hover": { backgroundColor: tokens["--accent"] },
    ":focus-visible": {
      outline: `2px solid ${tokens["--ring"]}`,
      outlineOffset: -2,
    },
  },
  breadcrumb: {
    display: "block",
    color: tokens["--muted-foreground"],
    fontSize: "0.75rem",
    marginBlockEnd: "0.25rem",
  },
  status: {
    color: tokens["--muted-foreground"],
    fontSize: "0.8125rem",
    margin: 0,
  },
  error: { color: tokens["--destructive"] },
})

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <label {...stylex.props(styles.theme)}>
      Theme
      <select
        aria-label="Theme"
        {...stylex.props(styles.select)}
        value={theme}
        onChange={(event) => {
          const value = event.target.value
          if (value === "light" || value === "dark" || value === "system")
            setTheme(value)
        }}
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
  )
}

function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useLocation({ select: (location) => location.pathname })
  return (
    <nav aria-label="Documentation" {...stylex.props(styles.nav)}>
      <ul {...stylex.props(styles.list)}>
        {tree.children.map((item) =>
          item.type === "separator" ? (
            <li key={String(item.name)} {...stylex.props(styles.group)}>
              {item.name}
            </li>
          ) : item.type === "page" ? (
            <li key={item.url}>
              <Link
                to={item.url}
                aria-current={pathname === item.url ? "page" : undefined}
                onClick={onNavigate}
                {...stylex.props(
                  styles.navLink,
                  pathname === item.url && styles.active,
                )}
              >
                {item.name}
              </Link>
            </li>
          ) : null,
        )}
      </ul>
    </nav>
  )
}

function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SortedResult[]>([])
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  )
  const inputRef = useRef<HTMLInputElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setOpen((value) => !value)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  useEffect(() => {
    if (!open || !query.trim()) return
    const controller = new AbortController()
    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search?query=${encodeURIComponent(query.trim())}`,
          { signal: controller.signal },
        )
        if (!response.ok) throw new Error("Search unavailable")
        const data: unknown = await response.json()
        if (
          !Array.isArray(data) ||
          !data.every(
            (item: unknown): item is SortedResult =>
              typeof item === "object" &&
              item !== null &&
              "id" in item &&
              typeof item.id === "string" &&
              "url" in item &&
              typeof item.url === "string" &&
              item.url.startsWith("/") &&
              !item.url.startsWith("//") &&
              "content" in item &&
              typeof item.content === "string" &&
              "type" in item &&
              (item.type === "page" ||
                item.type === "heading" ||
                item.type === "text") &&
              (!("breadcrumbs" in item) ||
                item.breadcrumbs === undefined ||
                (Array.isArray(item.breadcrumbs) &&
                  item.breadcrumbs.every(
                    (crumb: unknown) => typeof crumb === "string",
                  ))),
          )
        )
          throw new Error("Invalid search response")
        if (!controller.signal.aborted) {
          setResults(data)
          setStatus("ready")
        }
      } catch {
        if (!controller.signal.aborted) setStatus("error")
      }
    }, 180)
    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [open, query])

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value)
        if (value && query.trim()) setStatus("loading")
      }}
    >
      <DialogTrigger
        render={
          <Button
            variant="outline"
            ref={triggerRef}
            {...stylex.props(styles.search)}
          />
        }
      >
        <SearchIcon size={16} />
        Search docs<kbd {...stylex.props(styles.shortcut)}>⌘ / Ctrl K</kbd>
      </DialogTrigger>
      <DialogPopup
        {...stylex.props(styles.popup)}
        initialFocus={inputRef}
        finalFocus={triggerRef}
        bottomStickOnMobile={false}
      >
        <DialogTitle>Search documentation</DialogTitle>
        <DialogDescription>
          Find components, installation steps, and guides.
        </DialogDescription>
        <Input
          ref={inputRef}
          aria-label="Search documentation"
          type="search"
          value={query}
          placeholder="Search components and guides…"
          onChange={(event) => {
            setQuery(event.target.value)
            setResults([])
            setStatus(event.target.value.trim() ? "loading" : "idle")
          }}
        />
        <output
          aria-live="polite"
          {...stylex.props(styles.status, status === "error" && styles.error)}
        >
          {status === "error"
            ? "Search unavailable. Change your query to try again."
            : !query.trim()
              ? "Type to search all documentation."
              : status === "loading"
                ? "Searching…"
                : `${results.length} results`}
        </output>
        <ul aria-label="Search results" {...stylex.props(styles.results)}>
          {status === "ready"
            ? results.map((result) => (
                <li key={result.id}>
                  <Link
                    to={result.url}
                    onClick={() => setOpen(false)}
                    {...stylex.props(styles.result)}
                  >
                    {result.breadcrumbs?.length ? (
                      <span {...stylex.props(styles.breadcrumb)}>
                        {result.breadcrumbs
                          .join(" / ")
                          .replace(/<\/?mark>/g, "")}
                      </span>
                    ) : null}
                    {result.content.replace(/<\/?mark>/g, "")}
                  </Link>
                </li>
              ))
            : null}
        </ul>
      </DialogPopup>
    </Dialog>
  )
}

export function DocumentationLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  return (
    <div {...stylex.props(styles.shell)}>
      <a href="#docs-content" {...stylex.props(styles.skip)}>
        Skip to content
      </a>
      <header {...stylex.props(styles.header)}>
        <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
          <DialogTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open navigation"
                {...stylex.props(styles.mobile)}
              />
            }
          >
            <MenuIcon size={20} />
          </DialogTrigger>
          <DialogPopup
            {...stylex.props(styles.popup)}
            bottomStickOnMobile={false}
          >
            <DialogTitle>Documentation</DialogTitle>
            <DialogDescription>Browse guides and components.</DialogDescription>
            <Navigation onNavigate={() => setMobileOpen(false)} />
            <ThemeToggle />
          </DialogPopup>
        </Dialog>
        <Link to="/" {...stylex.props(styles.brand)}>
          Yopem UI
        </Link>
        <span {...stylex.props(styles.edition)}>STYLEX / REACT</span>
        <GlobalSearch />
      </header>
      <div {...stylex.props(styles.frame)}>
        <aside {...stylex.props(styles.sidebar)}>
          <Navigation />
          <ThemeToggle />
        </aside>
        <main id="docs-content" tabIndex={-1} {...stylex.props(styles.main)}>
          {children}
        </main>
      </div>
    </div>
  )
}
