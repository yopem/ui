"use client"

import type { ChangeEvent } from "react"

import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import {
  Dialog,
  DialogDescription,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@registry/components/ui/dialog"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@registry/components/ui/input-group"
import { ScrollArea } from "@registry/components/ui/scroll-area"
import { Stack } from "@registry/components/ui/stack"
import { useEventCallback } from "@registry/hooks/use-event-callback"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { Link, useHydrated } from "@tanstack/react-router"
import { staticClient } from "fumadocs-core/search/client/orama-static"
import { SearchIcon } from "lucide-react"
import { useRef, useState } from "react"
import { z } from "zod"

const primitiveStyles = stylex.create({
  searchDocumentation: {
    marginInlineStart: "auto",
    inlineSize: { default: "15rem", "@media (max-width: 767.98px)": "2.5rem" },
    justifyContent: {
      default: "flex-start",
      "@media (max-width: 767.98px)": "center",
    },
    color: tokens["--muted-foreground"],
    backgroundColor: {
      default: tokens["--muted"],
      ":hover": tokens["--accent"],
    },
    borderWidth: 0,
    blockSize: "2.5rem",
    gap: "0.75rem",
    paddingInline: "0.875rem",
    boxShadow: "none",
    borderRadius: tokens["--radius"],
  },
  searchField: {
    backgroundColor: tokens["--muted"],
    minBlockSize: "3rem",
  },
  searchInput: { fontSize: "1rem" },
  span: {
    display: { default: "inline", "@media (max-width: 767.98px)": "none" },
  },
  kbd: {
    marginInlineStart: "auto",
    fontFamily: tokens["--font-mono"],
    fontSize: "0.6875rem",
    display: { default: "inline", "@media (max-width: 767.98px)": "none" },
  },
  dialogPopup: { maxBlockSize: "min(42rem, 85dvh)" },
  dialogContent: { padding: "1.5rem", gap: "1rem", minBlockSize: 0 },
  output: {
    color: tokens["--muted-foreground"],
    fontSize: "0.8125rem",
    margin: "calc(var(--spacing) * 0)",
  },
  span2: { color: tokens["--destructive"] },
  searchResults: { minBlockSize: 0 },
  ul: {
    listStyleType: "none",
    margin: "calc(var(--spacing) * 0)",
    paddingBlock: "calc(var(--spacing) * 0)",
    paddingInline: "calc(var(--spacing) * 0)",
  },
  span3: {
    display: "block",
    color: tokens["--muted-foreground"],
    fontSize: "0.75rem",
    marginBlockEnd: "0.25rem",
  },
})

function listenForSearchShortcut(onShortcut: () => void) {
  function onKeyDown(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault()
      onShortcut()
    }
  }

  document.addEventListener("keydown", onKeyDown)

  return () => document.removeEventListener("keydown", onKeyDown)
}

const searchResultSchema = z.object({
  id: z.string(),
  url: z.string().refine((url) => url.startsWith("/") && !url.startsWith("//")),
  content: z.string(),
  type: z.enum(["page", "heading", "text"]),
  breadcrumbs: z.array(z.string()).optional(),
})

const searchResultsSchema = z.array(searchResultSchema)

type SearchResult = z.infer<typeof searchResultSchema>

let searchClient = staticClient({ from: "/api/search.json" })

export function GlobalSearch() {
  const hydrated = useHydrated()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])

  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  )

  const controllerRef = useRef<AbortController>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const [registerTrigger] = useState(
    () =>
      function registerTrigger(node: HTMLButtonElement | null) {
        if (!node) return
        triggerRef.current = node

        const cleanup = listenForSearchShortcut(() => {
          setOpen((value) => !value)
        })

        return () => {
          cleanup()
          triggerRef.current = null
          controllerRef.current?.abort()
        }
      },
  )

  const search = useEventCallback(async (nextQuery: string) => {
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
      const data = await searchClient.search(trimmedQuery)

      const parsed = searchResultsSchema.safeParse(data)

      if (!parsed.success) throw new Error("Invalid search response")

      if (!controller.signal.aborted) {
        setResults(parsed.data)
        setStatus("ready")
      }
    } catch {
      if (!controller.signal.aborted) {
        // Fumadocs caches rejected index loads by URL; retry with a fresh key.
        searchClient = staticClient({
          from: `/api/search.json?retry=${Date.now()}`,
        })
        setStatus("error")
      }
    }
  })

  const handleOpenChange = useEventCallback((value: boolean) => {
    setOpen(value)

    if (!value) controllerRef.current?.abort()
  })

  const handleChange = useEventCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextQuery = event.target.value
      setQuery(nextQuery)
      void search(nextQuery)
    },
  )

  const handleClick = useEventCallback(() => {
    return setOpen(false)
  })

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        disabled={!hydrated}
        render={
          <Button
            variant="ghost"
            ref={registerTrigger}
            aria-label="Search documentation"
            xstyle={primitiveStyles.searchDocumentation}
          />
        }
      >
        <SearchIcon size={16} aria-hidden="true" />
        <Box render={<span />} xstyle={primitiveStyles.span}>
          Search docs
        </Box>
        <Box render={<kbd />} xstyle={primitiveStyles.kbd}>
          ⌘ / Ctrl K
        </Box>
      </DialogTrigger>
      <DialogPopup
        xstyle={primitiveStyles.dialogPopup}
        initialFocus={inputRef}
        finalFocus={triggerRef}
        bottomStickOnMobile={false}
        frameTitle="Documentation"
      >
        <Stack xstyle={primitiveStyles.dialogContent}>
          <DialogTitle>Search documentation</DialogTitle>
          <DialogDescription>
            Find components, previews, installation steps, and guides.
          </DialogDescription>
          <InputGroup bordered={false} xstyle={primitiveStyles.searchField}>
            <InputGroupAddon>
              <SearchIcon size={20} aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              ref={inputRef}
              aria-label="Search documentation"
              type="search"
              value={query}
              placeholder="Search components, previews, and guides…"
              onChange={handleChange}
              xstyle={primitiveStyles.searchInput}
            />
          </InputGroup>
          <Box
            render={<output />}
            aria-live="polite"
            xstyle={primitiveStyles.output}
          >
            {status === "error" ? (
              <Box render={<span />} xstyle={primitiveStyles.span2}>
                Search unavailable. Change your query to try again.
              </Box>
            ) : !query.trim() ? (
              "Type to search all documentation."
            ) : status === "loading" ? (
              "Searching…"
            ) : (
              `${results.length} results`
            )}
          </Box>
          <ScrollArea
            aria-label="Search results"
            overscrollContain
            scrollFade
            xstyle={primitiveStyles.searchResults}
          >
            <Box render={<ul />} xstyle={primitiveStyles.ul}>
              {status === "ready"
                ? results.map((result) => (
                    <Box render={<li />} key={result.id}>
                      <Link
                        to={result.url}
                        onClick={handleClick}
                        {...stylex.props(styles.result)}
                      >
                        {result.breadcrumbs?.length ? (
                          <Box render={<span />} xstyle={primitiveStyles.span3}>
                            {result.breadcrumbs
                              .join(" / ")
                              .replace(/<\/?mark>/g, "")}
                          </Box>
                        ) : null}
                        {result.content.replace(/<\/?mark>/g, "")}
                      </Link>
                    </Box>
                  ))
                : null}
            </Box>
          </ScrollArea>
        </Stack>
      </DialogPopup>
    </Dialog>
  )
}

const styles = stylex.create({
  result: {
    display: "block",
    padding: "0.875rem",
    textDecoration: "none",
    color: tokens["--foreground"],
    borderRadius: tokens["--radius"],
    ":hover": { backgroundColor: tokens["--accent"] },
    ":focus-visible": {
      outlineColor: tokens["--ring"],
      outlineStyle: "solid",
      outlineWidth: 2,
      outlineOffset: -2,
    },
  },
})
