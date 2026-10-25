"use client"

import type { InputProps } from "@registry/components/ui/input"
import type { LexicalEditor } from "lexical"
import type { ComponentProps, ReactNode } from "react"

import { createDOMRange } from "@lexical/selection"
import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Input } from "@registry/components/ui/input"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { $getNodeByKey, $getRoot, $isTextNode, mergeRegister } from "lexical"
import { createContext, use, useState, useSyncExternalStore } from "react"

import { useEditor } from "./root"
import {
  findEditorSearchMatches,
  normalizeEditorSearchQuery,
} from "./search-model"

interface EditorSearchRectangle {
  readonly key: string
  readonly left: number
  readonly top: number
  readonly width: number
  readonly height: number
  readonly active: boolean
}

interface EditorSearchSnapshot {
  readonly query: string
  readonly matches: ReturnType<typeof findEditorSearchMatches>["matches"]
  readonly hasMore: boolean
  readonly activeIndex: number
  readonly rectangles: readonly EditorSearchRectangle[]
}

const styles = stylex.create({
  viewport: { position: "relative" },
  overlay: {
    inset: 0,
    overflow: "hidden",
    pointerEvents: "none",
    position: "absolute",
    zIndex: 1,
  },
  highlight: (left: number, top: number, width: number, height: number) => ({
    backgroundColor: tokens["--accent"],
    borderRadius: tokens["--radius-sm"],
    height,
    left,
    position: "absolute",
    width,
    top,
  }),
  active: {
    outlineColor: tokens["--ring"],
    outlineStyle: "solid",
    outlineWidth: 1,
  },
})

function createEditorSearchController(
  editor: LexicalEditor,
  initialQuery: string,
) {
  const listeners = new Set<() => void>()
  let query = normalizeEditorSearchQuery(initialQuery)
  let matches: EditorSearchSnapshot["matches"] = []
  let hasMore = false
  let activeIndex = -1
  let rectangles: readonly EditorSearchRectangle[] = []
  let viewport: HTMLElement | null = null
  let root: HTMLElement | null = null
  let resizeObserver: ResizeObserver | undefined
  let resizeWindow: Window | null = null
  let unregister: (() => void) | undefined

  function readMatches() {
    if (!query) return { matches: [], hasMore: false }

    return editor.getEditorState().read(() =>
      findEditorSearchMatches(
        $getRoot()
          .getAllTextNodes()
          .map((node) => ({ key: node.getKey(), text: node.getTextContent() })),
        query,
      ),
    )
  }

  function readRectangles() {
    const currentRoot = editor.getRootElement()

    if (!query || !viewport || !currentRoot) return []

    const viewportRect = viewport.getBoundingClientRect()
    const nextRectangles: EditorSearchRectangle[] = []

    editor.getEditorState().read(() => {
      for (const [matchIndex, match] of matches.entries()) {
        const node = $getNodeByKey(match.key)

        if (!$isTextNode(node)) continue
        const range = createDOMRange(editor, node, match.start, node, match.end)

        if (!range) continue

        for (const [rectIndex, rect] of Array.from(
          range.getClientRects(),
        ).entries()) {
          if (!rect.width || !rect.height) continue

          nextRectangles.push({
            key: `${match.key}:${match.start}:${rectIndex}`,
            left: rect.left - viewportRect.left,
            top: rect.top - viewportRect.top,
            width: rect.width,
            height: rect.height,
            active: matchIndex === activeIndex,
          })
        }
      }
    })

    return nextRectangles
  }

  function publish() {
    rectangles = readRectangles()
    snapshot = {
      query,
      matches,
      hasMore,
      activeIndex,
      rectangles,
    }

    for (const listener of listeners) listener()
  }

  function rescan() {
    const result = readMatches()
    matches = result.matches
    hasMore = result.hasMore
    activeIndex = matches.length ? 0 : -1
    publish()
  }

  function refreshGeometry() {
    publish()
  }

  function handleResize() {
    refreshGeometry()
  }

  function handleScroll() {
    refreshGeometry()
  }

  function observeGeometry() {
    resizeObserver?.disconnect()
    resizeObserver = undefined
    const view = (viewport ?? root)?.ownerDocument.defaultView ?? null

    if (resizeWindow !== view) {
      resizeWindow?.removeEventListener("resize", handleResize)
      resizeWindow = view
      resizeWindow?.addEventListener("resize", handleResize, { passive: true })
    }

    const ResizeObserverConstructor = view?.ResizeObserver

    if (ResizeObserverConstructor) {
      resizeObserver = new ResizeObserverConstructor(handleResize)

      if (viewport) resizeObserver.observe(viewport)

      if (root) resizeObserver.observe(root)
    }
  }

  function setRoot(nextRoot: HTMLElement | null) {
    root?.removeEventListener("scroll", handleScroll)
    root = nextRoot
    root?.addEventListener("scroll", handleScroll, { passive: true })
    observeGeometry()
    refreshGeometry()
  }

  function start() {
    const unregisterRoot = editor.registerRootListener((nextRoot) => {
      setRoot(nextRoot)
    })

    const unregisterUpdates = editor.registerUpdateListener(
      ({ dirtyElements, dirtyLeaves }) => {
        if (dirtyElements.size || dirtyLeaves.size) rescan()
      },
    )

    unregister = mergeRegister(unregisterRoot, unregisterUpdates, () => {
      root?.removeEventListener("scroll", handleScroll)
      resizeObserver?.disconnect()
      resizeWindow?.removeEventListener("resize", handleResize)
      root = null
      resizeObserver = undefined
      resizeWindow = null
    })
    rescan()
  }

  let snapshot: EditorSearchSnapshot = {
    query,
    matches,
    hasMore,
    activeIndex,
    rectangles,
  }

  const initialResult = readMatches()
  matches = initialResult.matches
  hasMore = initialResult.hasMore
  activeIndex = matches.length ? 0 : -1
  snapshot = { query, matches, hasMore, activeIndex, rectangles }
  const serverSnapshot = snapshot

  function selectMatch(direction: -1 | 1) {
    if (!matches.length) return false

    const nextIndex =
      activeIndex < 0
        ? direction === 1
          ? 0
          : matches.length - 1
        : (activeIndex + direction + matches.length) % matches.length

    const match = matches[nextIndex]

    if (!match) return false

    let selected = false

    editor.update(
      () => {
        const node = $getNodeByKey(match.key)

        if (!$isTextNode(node) || !node.isAttached()) return
        const text = node.getTextContent()

        const currentMatch = findEditorSearchMatches(
          [{ key: match.key, text }],
          query,
        ).matches.some(
          (candidate) =>
            candidate.start === match.start && candidate.end === match.end,
        )

        if (!currentMatch) return
        node.select(match.start, match.end)
        selected = true
      },
      { discrete: true },
    )

    if (!selected) {
      rescan()

      return false
    }

    activeIndex = nextIndex
    publish()
    editor.focus()

    return true
  }

  return {
    getSnapshot(this: void) {
      return snapshot
    },
    getServerSnapshot(this: void) {
      return serverSnapshot
    },
    subscribe(this: void, listener: () => void) {
      listeners.add(listener)

      if (!unregister) start()

      return () => {
        listeners.delete(listener)

        if (!listeners.size) {
          unregister?.()
          unregister = undefined
          rectangles = []
          snapshot = { query, matches, hasMore, activeIndex, rectangles }
        }
      }
    },
    setViewport(nextViewport: HTMLElement | null) {
      if (viewport === nextViewport) return
      viewport = nextViewport

      if (unregister) observeGeometry()

      if (nextViewport) refreshGeometry()
      else {
        rectangles = []
        snapshot = { query, matches, hasMore, activeIndex, rectangles }
      }
    },
    setQuery(value: string) {
      const nextQuery = normalizeEditorSearchQuery(value)

      if (query === nextQuery) return
      query = nextQuery
      rescan()
    },
    previous() {
      return selectMatch(-1)
    },
    next() {
      return selectMatch(1)
    },
  }
}

type EditorSearchController = ReturnType<typeof createEditorSearchController>

const EditorSearchContext = createContext<EditorSearchController | null>(null)

function useEditorSearch() {
  const controller = use(EditorSearchContext)

  if (!controller) throw new Error("Search parts require EditorSearchRoot.")

  const snapshot = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getServerSnapshot,
  )

  return { controller, snapshot }
}

export function EditorSearchRoot({
  children,
  initialQuery = "",
}: {
  children: ReactNode
  initialQuery?: string
}) {
  const editor = useEditor()

  const [controller] = useState(() =>
    createEditorSearchController(editor, initialQuery),
  )

  return (
    <EditorSearchContext value={controller}>{children}</EditorSearchContext>
  )
}

export type EditorSearchInputProps = Omit<
  InputProps,
  "defaultValue" | "type" | "value"
>

export function EditorSearchInput({
  "aria-label": label = "Search editor",
  onChange,
  onKeyDown,
  ...props
}: EditorSearchInputProps) {
  const { controller, snapshot } = useEditorSearch()

  function handleKeyDown(
    event: Parameters<NonNullable<EditorSearchInputProps["onKeyDown"]>>[0],
  ) {
    onKeyDown?.(event)

    if (event.defaultPrevented || event.nativeEvent.isComposing) return

    if (event.key !== "Enter") return

    event.preventDefault()

    if (event.shiftKey) controller.previous()
    else controller.next()
  }

  return (
    <Input
      {...props}
      aria-label={label}
      type="search"
      value={snapshot.query}
      onChange={(event) => {
        onChange?.(event)

        if (!event.defaultPrevented)
          controller.setQuery(event.currentTarget.value)
      }}
      onKeyDown={handleKeyDown}
    />
  )
}

export type EditorSearchButtonProps = Omit<
  ComponentProps<typeof Button>,
  "render"
>

function EditorSearchNavigationButton({
  direction,
  children,
  disabled,
  onMouseDown,
  onClick,
  ...props
}: EditorSearchButtonProps & {
  direction: -1 | 1
}) {
  const { controller, snapshot } = useEditorSearch()

  return (
    <Button
      {...props}
      variant="ghost"
      size="sm"
      disabled={disabled === true || snapshot.matches.length === 0}
      onMouseDown={(event) => {
        onMouseDown?.(event)

        if (!event.defaultPrevented) event.preventDefault()
      }}
      onClick={(event) => {
        onClick?.(event)

        if (event.defaultPrevented || disabled === true) return

        if (direction === -1) controller.previous()
        else controller.next()
      }}
    >
      {children ?? (direction === -1 ? "Previous match" : "Next match")}
    </Button>
  )
}

export function EditorSearchPreviousButton(props: EditorSearchButtonProps) {
  return <EditorSearchNavigationButton {...props} direction={-1} />
}

export function EditorSearchNextButton(props: EditorSearchButtonProps) {
  return <EditorSearchNavigationButton {...props} direction={1} />
}

export function EditorSearchStatus() {
  const { snapshot } = useEditorSearch()
  const resultCount = snapshot.matches.length
  const current = snapshot.activeIndex < 0 ? 0 : snapshot.activeIndex + 1

  return (
    <Box render={<output />} aria-label="Search results">
      {`${current} of ${resultCount}${snapshot.hasMore ? "+" : ""}`}
    </Box>
  )
}

export function EditorSearchViewport({ children }: { children: ReactNode }) {
  const { controller, snapshot } = useEditorSearch()

  const [setViewport] = useState(
    () => (element: HTMLDivElement | null) => controller.setViewport(element),
  )

  return (
    <Box ref={setViewport} xstyle={styles.viewport}>
      {children}
      <Box
        aria-hidden="true"
        data-slot="editor-search-overlays"
        render={<div />}
        xstyle={styles.overlay}
      >
        {snapshot.rectangles.map((rectangle) => (
          <Box
            key={rectangle.key}
            aria-hidden="true"
            data-slot="editor-search-highlight"
            render={<span />}
            {...stylex.props(
              styles.highlight(
                rectangle.left,
                rectangle.top,
                rectangle.width,
                rectangle.height,
              ),
              rectangle.active && styles.active,
            )}
          />
        ))}
      </Box>
    </Box>
  )
}
