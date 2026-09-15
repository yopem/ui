"use client"

import type { SortedResult } from "fumadocs-core/search"

import { Button } from "@registry/components/ui/button"
import {
  Dialog,
  DialogDescription,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@registry/components/ui/dialog"
import { Input } from "@registry/components/ui/input"
import { ScrollArea } from "@registry/components/ui/scroll-area"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { Link } from "@tanstack/react-router"
import { SearchIcon } from "lucide-react"
import { useCallback, useRef, useState } from "react"

function isSearchResult(value: unknown): value is SortedResult {
  if (typeof value !== "object" || value === null) return false
  if (!("id" in value) || typeof value.id !== "string") return false
  if (!("url" in value) || typeof value.url !== "string") return false
  if (!value.url.startsWith("/") || value.url.startsWith("//")) return false
  if (!("content" in value) || typeof value.content !== "string") return false
  if (
    !("type" in value) ||
    (value.type !== "page" && value.type !== "heading" && value.type !== "text")
  )
    return false
  return (
    !("breadcrumbs" in value) ||
    value.breadcrumbs === undefined ||
    (Array.isArray(value.breadcrumbs) &&
      value.breadcrumbs.every((crumb) => typeof crumb === "string"))
  )
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SortedResult[]>([])
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  )
  const controllerRef = useRef<AbortController>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const registerTrigger = useCallback((node: HTMLButtonElement | null) => {
    triggerRef.current = node
    if (!node) return

    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setOpen((value) => !value)
      }
    }

    document.addEventListener("keydown", onKeyDown)
    return () => {
      controllerRef.current?.abort()
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [])

  async function search(nextQuery: string) {
    controllerRef.current?.abort()
    const trimmedQuery = nextQuery.trim()
    if (!trimmedQuery) {
      setResults([])
      setStatus("idle")
      return
    }

    const controller = new AbortController()
    controllerRef.current = controller
    setResults([])
    setStatus("loading")

    try {
      const response = await fetch(
        `/api/search?query=${encodeURIComponent(trimmedQuery)}`,
        { signal: controller.signal },
      )
      if (!response.ok) throw new Error("Search unavailable")
      const data: unknown = await response.json()
      if (!Array.isArray(data) || !data.every(isSearchResult))
        throw new Error("Invalid search response")
      if (!controller.signal.aborted) {
        setResults(data)
        setStatus("ready")
      }
    } catch {
      if (!controller.signal.aborted) setStatus("error")
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value)
        if (!value) controllerRef.current?.abort()
      }}
    >
      <DialogTrigger
        render={
          <Button
            variant="outline"
            ref={registerTrigger}
            {...stylex.props(styles.trigger)}
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
          Find components, examples, installation steps, and guides.
        </DialogDescription>
        <Input
          ref={inputRef}
          aria-label="Search documentation"
          type="search"
          value={query}
          placeholder="Search components, examples, and guides…"
          onChange={(event) => {
            const nextQuery = event.target.value
            setQuery(nextQuery)
            void search(nextQuery)
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
        <ScrollArea
          aria-label="Search results"
          overscrollContain
          scrollFade
          xstyle={styles.resultsScroll}
        >
          <ul {...stylex.props(styles.results)}>
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
        </ScrollArea>
      </DialogPopup>
    </Dialog>
  )
}

const styles = stylex.create({
  trigger: {
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
  popup: { padding: "1.5rem", gap: "1rem", maxBlockSize: "min(42rem, 85dvh)" },
  resultsScroll: { minBlockSize: 0 },
  results: { listStyleType: "none", margin: 0, padding: 0 },
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
