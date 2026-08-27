"use client"

import "@fontsource-variable/inter"
import { rootStyles } from "@registry/styles/root"
import stylesCss from "@registry/styles/styles.css?url"
import * as stylex from "@stylexjs/stylex"
import { Link } from "@tanstack/react-router"
import { useEffect, useRef, useState } from "react"

import {
  Popover,
  PopoverPopup,
  PopoverTrigger,
} from "@/components/ui/stylex/popover"

import type { CatalogDemo } from "./components"

export const catalogStylesheet = stylesCss

export function CatalogShell({ children }: { children: React.ReactNode }) {
  return (
    <div {...stylex.props(rootStyles.body, catalogStyles.shell)}>
      <header {...stylex.props(catalogStyles.header)}>
        <Link to="/components" {...stylex.props(catalogStyles.brand)}>
          <span>Yopem UI</span>
          <span {...stylex.props(catalogStyles.edition)}>StyleX catalog</span>
        </Link>
        <span {...stylex.props(catalogStyles.headerLink)}>
          508 migrated demos
        </span>
      </header>
      <main {...stylex.props(catalogStyles.main)}>{children}</main>
    </div>
  )
}

export function InstallCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(command)
    setCopied(true)
    globalThis.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div {...stylex.props(catalogStyles.install)}>
      <code {...stylex.props(catalogStyles.installCode)}>{command}</code>
      <button
        {...stylex.props(catalogStyles.copyButton)}
        onClick={copy}
        type="button"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  )
}

export function DemoPanel({ demo }: { demo: CatalogDemo }) {
  const [open, setOpen] = useState(false)
  const [prepared, setPrepared] = useState(false)
  const openFrame = useRef(0)
  const [mode, setMode] = useState<"preview" | "source">("preview")
  const [source, setSource] = useState<string>()
  const [sourceError, setSourceError] = useState(false)
  const LazyDemo = demo.component

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
            {...stylex.props(catalogStyles.demo, catalogStyles.demoSummary)}
            type="button"
          />
        }
      >
        <code>{demo.name}</code>
        <span>{open ? "Close" : "Open"}</span>
      </PopoverTrigger>
      <PopoverPopup
        align="start"
        instant
        portalProps={{ keepMounted: prepared }}
      >
        <div {...stylex.props(catalogStyles.demoPopup)}>
          <div {...stylex.props(catalogStyles.demoTabs)}>
            <button
              {...stylex.props(
                catalogStyles.tab,
                mode === "preview" && catalogStyles.activeTab,
              )}
              onClick={() => setMode("preview")}
              type="button"
            >
              Live demo
            </button>
            <button
              {...stylex.props(
                catalogStyles.tab,
                mode === "source" && catalogStyles.activeTab,
              )}
              onClick={() => setMode("source")}
              type="button"
            >
              Source
            </button>
          </div>
          {mode === "preview" ? (
            <div {...stylex.props(catalogStyles.preview)}>
              <LazyDemo />
            </div>
          ) : (
            <pre {...stylex.props(catalogStyles.source)}>
              <code>
                {sourceError
                  ? "Source unavailable."
                  : (source ?? "Loading source…")}
              </code>
            </pre>
          )}
        </div>
      </PopoverPopup>
    </Popover>
  )
}

export const catalogStyles = stylex.create({
  activeTab: {
    backgroundColor: "var(--foreground)",
    color: "var(--background)",
  },
  brand: {
    alignItems: "baseline",
    color: "var(--foreground)",
    display: "flex",
    fontSize: "1rem",
    fontWeight: 700,
    gap: "0.625rem",
    textDecorationLine: "none",
  },
  breadcrumb: {
    color: "var(--muted-foreground)",
    fontSize: "0.8125rem",
    textDecorationLine: {
      default: "none",
      ":hover": "underline",
    },
    textUnderlineOffset: "0.2em",
  },
  card: {
    backgroundColor: {
      default: "var(--card)",
      ":hover": "color-mix(in srgb, var(--card), var(--foreground) 2%)",
    },
    borderColor: "var(--border)",
    borderRadius: "0.875rem",
    borderStyle: "solid",
    borderWidth: 1,
    color: "var(--foreground)",
    display: "grid",
    gap: "1rem",
    minBlockSize: "9rem",
    padding: "1.125rem",
    textDecorationLine: "none",
    transitionDuration: "150ms",
    transitionProperty: "background-color, border-color, transform",
    ":focus-visible": {
      outlineColor: "var(--ring)",
      outlineOffset: 3,
      outlineStyle: "solid",
      outlineWidth: 2,
    },
    ":hover": { transform: "translateY(-2px)" },
  },
  cardCount: {
    color: "var(--muted-foreground)",
    fontSize: "0.75rem",
    marginBlockStart: "auto",
  },
  cardTitle: {
    fontSize: "1rem",
    fontWeight: 650,
    letterSpacing: "-0.01em",
    margin: 0,
  },
  copyButton: {
    backgroundColor: {
      default: "var(--secondary)",
      ":hover": "var(--accent)",
    },
    borderColor: "var(--border)",
    borderRadius: "0.5rem",
    borderStyle: "solid",
    borderWidth: 1,
    color: "var(--secondary-foreground)",
    cursor: "pointer",
    font: "inherit",
    fontSize: "0.75rem",
    fontWeight: 650,
    paddingBlock: "0.45rem",
    paddingInline: "0.7rem",
  },
  demo: {
    backgroundColor: "var(--card)",
    borderColor: "var(--border)",
    borderRadius: "0.875rem",
    borderStyle: "solid",
    borderWidth: 1,
    overflow: "clip",
  },
  demoList: { display: "grid", gap: "1rem" },
  demoPopup: { inlineSize: "min(42rem, calc(100vw - 2rem))" },
  demoSummary: {
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
    backgroundColor: "var(--muted)",
    borderBlockStartColor: "var(--border)",
    borderBlockStartStyle: "solid",
    borderBlockStartWidth: 1,
    display: "flex",
    gap: "0.25rem",
    padding: "0.375rem",
  },
  detailHeader: {
    display: "grid",
    gap: "1rem",
    marginBlockEnd: "2rem",
  },
  edition: {
    color: "var(--muted-foreground)",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    fontSize: "0.6875rem",
    fontWeight: 500,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  empty: {
    borderColor: "var(--border)",
    borderRadius: "0.875rem",
    borderStyle: "dashed",
    borderWidth: 1,
    color: "var(--muted-foreground)",
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
  header: {
    alignItems: "center",
    borderBlockEndColor: "var(--border)",
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: 1,
    display: "flex",
    justifyContent: "space-between",
    marginInline: "auto",
    maxInlineSize: "82rem",
    paddingBlock: "1rem",
    paddingInline: {
      default: "1rem",
      "@media (min-width: 48rem)": "2rem",
    },
  },
  headerLink: {
    color: "var(--muted-foreground)",
    fontSize: "0.8125rem",
    textDecorationLine: {
      default: "none",
      ":hover": "underline",
    },
  },
  hero: {
    borderBlockEndColor: "var(--border)",
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: 1,
    display: "grid",
    gap: "0.75rem",
    marginBlockEnd: "1.5rem",
    paddingBlockEnd: "1.75rem",
  },
  install: {
    alignItems: "center",
    backgroundColor: "var(--muted)",
    borderColor: "var(--border)",
    borderRadius: "0.75rem",
    borderStyle: "solid",
    borderWidth: 1,
    display: "flex",
    gap: "0.75rem",
    justifyContent: "space-between",
    maxInlineSize: "42rem",
    padding: "0.5rem",
    paddingInlineStart: "0.875rem",
  },
  installCode: {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    fontSize: "0.8125rem",
    overflowWrap: "anywhere",
  },
  lead: {
    color: "var(--muted-foreground)",
    fontSize: "1rem",
    lineHeight: 1.65,
    margin: 0,
    maxInlineSize: "42rem",
  },
  main: {
    marginInline: "auto",
    maxInlineSize: "82rem",
    paddingBlock: {
      default: "2rem",
      "@media (min-width: 48rem)": "3.5rem",
    },
    paddingInline: {
      default: "1rem",
      "@media (min-width: 48rem)": "2rem",
    },
  },
  preview: {
    alignItems: "center",
    borderBlockStartColor: "var(--border)",
    borderBlockStartStyle: "solid",
    borderBlockStartWidth: 1,
    display: "flex",
    justifyContent: "center",
    minBlockSize: "12rem",
    overflow: "auto",
    padding: "1.5rem",
  },
  search: {
    backgroundColor: "var(--background)",
    borderColor: "var(--input)",
    borderRadius: "0.75rem",
    borderStyle: "solid",
    borderWidth: 1,
    color: "var(--foreground)",
    font: "inherit",
    inlineSize: "100%",
    maxInlineSize: "32rem",
    outline: "none",
    paddingBlock: "0.75rem",
    paddingInline: "0.9rem",
    ":focus": { borderColor: "var(--ring)" },
  },
  section: {
    display: "grid",
    gap: "1rem",
    marginBlockStart: "2.5rem",
  },
  sectionTitle: {
    fontSize: "1.125rem",
    fontWeight: 650,
    letterSpacing: "-0.015em",
    margin: 0,
  },
  shell: {
    backgroundColor: "var(--background)",
    color: "var(--foreground)",
    fontFamily: "Inter Variable, ui-sans-serif, system-ui, sans-serif",
    minBlockSize: "100vh",
  },
  source: {
    backgroundColor: "color-mix(in srgb, var(--foreground), transparent 96%)",
    borderBlockStartColor: "var(--border)",
    borderBlockStartStyle: "solid",
    borderBlockStartWidth: 1,
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    fontSize: "0.75rem",
    lineHeight: 1.65,
    margin: 0,
    maxBlockSize: "36rem",
    overflow: "auto",
    padding: "1rem",
    whiteSpace: "pre",
  },
  tab: {
    backgroundColor: "transparent",
    borderWidth: 0,
    borderRadius: "0.45rem",
    color: "var(--muted-foreground)",
    cursor: "pointer",
    font: "inherit",
    fontSize: "0.75rem",
    fontWeight: 650,
    paddingBlock: "0.45rem",
    paddingInline: "0.7rem",
  },
  title: {
    fontSize: {
      default: "2.25rem",
      "@media (min-width: 48rem)": "3.5rem",
    },
    fontWeight: 720,
    letterSpacing: "-0.045em",
    lineHeight: 0.98,
    margin: 0,
    maxInlineSize: "16ch",
  },
  unavailable: {
    color: "var(--muted-foreground)",
    fontSize: "0.875rem",
    margin: 0,
  },
})
