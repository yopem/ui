"use client"

import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { Link } from "@tanstack/react-router"
import { Suspense, useEffect, useRef, useState } from "react"

import {
  Popover,
  PopoverPopup,
  PopoverTrigger,
} from "@/components/ui/stylex/popover"

import { CopyableCode, KeyboardScrollArea } from "./code-block"
import { getCatalogItem, type CatalogDemo } from "./components"
import { getExampleDependencies } from "./example-dependencies"

const exampleHelpers = Object.entries(
  import.meta.glob<string>("../hooks/*.ts", {
    query: "?raw",
    import: "default",
    eager: true,
  }),
).map(([path, content]) => ({
  name: path.replace("../hooks/", "@registry/hooks/").replace(/\.ts$/, ""),
  path: path.replace("../hooks/", "src/yopem/hooks/"),
  content,
}))

export function DemoPanel({ demo }: { demo: CatalogDemo }) {
  const [open, setOpen] = useState(false)
  const [prepared, setPrepared] = useState(false)
  const openFrame = useRef(0)
  const [mode, setMode] = useState<"preview" | "source">("preview")
  const [source, setSource] = useState<string>()
  const [sourceError, setSourceError] = useState(false)
  const LazyDemo = demo.component
  const { components, packages } = getExampleDependencies(source ?? "")

  useEffect(() => {
    if (!open || mode !== "source" || source !== undefined || sourceError)
      return
    let cancelled = false
    void demo
      .loadSource()
      .then((value) => {
        if (!cancelled) setSource(value)
      })
      .catch(() => {
        if (!cancelled) setSourceError(true)
      })
    return () => {
      cancelled = true
    }
  }, [demo, mode, open, source, sourceError])

  useEffect(() => () => cancelAnimationFrame(openFrame.current), [])

  const onOpenChange = (nextOpen: boolean) => {
    cancelAnimationFrame(openFrame.current)
    if (!nextOpen) {
      setOpen(false)
      return
    }
    setPrepared(true)
    openFrame.current = requestAnimationFrame(() => setOpen(true))
  }

  return (
    <Popover onOpenChange={onOpenChange} open={open}>
      <PopoverTrigger
        render={
          <button
            {...stylex.props(
              catalogStyles.demo,
              catalogStyles.demoSummary,
              localStyles.focus,
            )}
            type="button"
          />
        }
      >
        <span>Example {demo.name.split("-").at(-1)}</span>
        <span>{open ? "Close" : "Open"}</span>
      </PopoverTrigger>
      <PopoverPopup align="start" portalProps={{ keepMounted: prepared }}>
        <KeyboardScrollArea
          {...stylex.props(catalogStyles.demoPopup, localStyles.focus)}
          aria-label={`${demo.name} example`}
        >
          <div {...stylex.props(catalogStyles.demoTabs)}>
            <button
              {...stylex.props(
                catalogStyles.tab,
                localStyles.focus,
                mode === "preview" && catalogStyles.activeTab,
              )}
              aria-pressed={mode === "preview"}
              onClick={() => setMode("preview")}
              type="button"
            >
              Live demo
            </button>
            <button
              {...stylex.props(
                catalogStyles.tab,
                localStyles.focus,
                mode === "source" && catalogStyles.activeTab,
              )}
              aria-pressed={mode === "source"}
              onClick={() => setMode("source")}
              type="button"
            >
              Source
            </button>
          </div>
          {mode === "preview" ? (
            <KeyboardScrollArea
              {...stylex.props(catalogStyles.preview, localStyles.focus)}
              aria-label={`${demo.name} live preview`}
            >
              <Suspense
                fallback={
                  <p {...stylex.props(localStyles.p)}>Loading example…</p>
                }
              >
                <LazyDemo />
              </Suspense>
            </KeyboardScrollArea>
          ) : source ? (
            <div {...stylex.props(localStyles.source)}>
              <p {...stylex.props(localStyles.p)}>
                Copy the source for every component used by this example:
              </p>
              <ul {...stylex.props(localStyles.list)}>
                {components.map((name) => (
                  <li {...stylex.props(localStyles.item)} key={name}>
                    <Link
                      {...stylex.props(localStyles.link, localStyles.focus)}
                      to="/components/$name"
                      params={{ name }}
                    >
                      {getCatalogItem(name)?.title ?? name}
                    </Link>
                  </li>
                ))}
              </ul>
              <p {...stylex.props(localStyles.p)}>
                Npm packages:{" "}
                {packages.join(", ") || "None beyond the shared setup"}.
              </p>
              <CopyableCode code={source} title={demo.file} />
              {exampleHelpers.map((helper) =>
                source.includes(helper.name) ? (
                  <CopyableCode
                    key={helper.path}
                    code={helper.content}
                    title={helper.path}
                  />
                ) : null,
              )}
            </div>
          ) : (
            <output
              {...stylex.props(
                localStyles.status,
                sourceError && localStyles.error,
              )}
            >
              {sourceError
                ? "Source unavailable. Close and reopen this page to retry."
                : "Loading source…"}
            </output>
          )}
        </KeyboardScrollArea>
      </PopoverPopup>
    </Popover>
  )
}

export const catalogStyles = stylex.create({
  activeTab: {
    backgroundColor: tokens["--foreground"],
    color: tokens["--background"],
  },
  card: {
    backgroundColor: {
      default: tokens["--card"],
      ":hover": tokens["--accent"],
    },
    borderColor: tokens["--border"],
    borderRadius: tokens["--radius-xl"],
    borderStyle: "solid",
    borderWidth: 1,
    color: tokens["--foreground"],
    display: "grid",
    gap: "1rem",
    minBlockSize: "9rem",
    padding: "1.125rem",
    textDecorationLine: "none",
    ":focus-visible": {
      outlineColor: tokens["--ring"],
      outlineOffset: 3,
      outlineStyle: "solid",
      outlineWidth: 2,
    },
  },
  cardCount: {
    color: tokens["--muted-foreground"],
    fontSize: "0.75rem",
    marginBlockStart: "auto",
  },
  cardTitle: {
    fontSize: "1rem",
    fontWeight: 650,
    letterSpacing: "-0.01em",
    margin: 0,
  },
  demo: {
    backgroundColor: tokens["--card"],
    borderColor: tokens["--border"],
    borderRadius: tokens["--radius-xl"],
    borderStyle: "solid",
    borderWidth: 1,
    overflow: "clip",
  },
  demoList: { display: "grid", gap: "1rem" },
  demoPopup: {
    inlineSize: "min(42rem, calc(100vw - 2rem))",
    maxInlineSize: "100%",
    minInlineSize: 0,
    maxBlockSize: "min(42rem, 80dvh)",
    overflow: "auto",
    color: tokens["--popover-foreground"],
  },
  demoSummary: {
    color: tokens["--card-foreground"],
    fontFamily: tokens["--font-sans"],
    inlineSize: "100%",
    alignItems: "center",
    cursor: "pointer",
    display: "flex",
    fontSize: "0.8125rem",
    fontWeight: 600,
    justifyContent: "space-between",
    listStyle: "none",
    paddingBlock: "0.875rem",
    paddingInline: "1rem",
  },
  demoTabs: {
    alignItems: "center",
    backgroundColor: tokens["--muted"],
    borderBlockStartColor: tokens["--border"],
    borderBlockStartStyle: "solid",
    borderBlockStartWidth: 1,
    display: "flex",
    gap: "0.25rem",
    padding: "0.375rem",
  },
  empty: {
    borderColor: tokens["--border"],
    borderRadius: tokens["--radius-xl"],
    borderStyle: "dashed",
    borderWidth: 1,
    color: tokens["--muted-foreground"],
    gridColumn: "1 / -1",
    padding: "2rem",
    textAlign: "center",
  },
  grid: {
    display: "grid",
    gap: "0.75rem",
    gridTemplateColumns: {
      default: "1fr",
      "@media (min-width: 40rem)": "repeat(2, minmax(0, 1fr))",
      "@media (min-width: 64rem)": "repeat(3, minmax(0, 1fr))",
    },
  },
  preview: {
    alignItems: "center",
    borderBlockStartColor: tokens["--border"],
    borderBlockStartStyle: "solid",
    borderBlockStartWidth: 1,
    display: "flex",
    justifyContent: "center",
    minBlockSize: "12rem",
    gap: "1rem",
    overflow: "auto",
    padding: "1.5rem",
  },
  search: {
    backgroundColor: tokens["--background"],
    borderColor: tokens["--input"],
    borderRadius: tokens["--radius-lg"],
    borderStyle: "solid",
    borderWidth: 1,
    color: tokens["--foreground"],
    font: "inherit",
    inlineSize: "100%",
    maxInlineSize: "32rem",
    paddingBlock: "0.75rem",
    paddingInline: "0.9rem",
    ":focus-visible": {
      outlineColor: tokens["--ring"],
      outlineStyle: "solid",
      outlineWidth: 2,
      outlineOffset: 2,
    },
  },
  tab: {
    minBlockSize: "2.25rem",
    backgroundColor: "transparent",
    borderWidth: 0,
    borderRadius: tokens["--radius-sm"],
    color: tokens["--muted-foreground"],
    cursor: "pointer",
    font: "inherit",
    fontSize: "0.75rem",
    fontWeight: 650,
    paddingBlock: "0.45rem",
    paddingInline: "0.7rem",
  },
})

const localStyles = stylex.create({
  focus: {
    ":focus-visible": {
      outlineColor: tokens["--ring"],
      outlineStyle: "solid",
      outlineWidth: 2,
      outlineOffset: -2,
    },
  },
  source: { padding: "1rem", minInlineSize: 0 },
  p: { marginBlock: "0.75rem", lineHeight: 1.7 },
  list: {
    marginBlock: "0.75rem",
    paddingInlineStart: "1.5rem",
    listStyleType: "disc",
  },
  item: { paddingBlock: "0.25rem" },
  link: {
    color: tokens["--primary"],
    textDecorationLine: "underline",
    textUnderlineOffset: "0.2em",
  },
  status: {
    display: "block",
    padding: "1rem",
    color: tokens["--muted-foreground"],
    overflowWrap: "anywhere",
  },
  error: { color: tokens["--destructive"] },
})
