"use client"

import type { EditorState } from "lexical"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Stack } from "@registry/components/ui/stack"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import {
  EditorContent,
  EditorHistoryButton,
  EditorRoot,
  EditorToolbar,
} from "@yopem-ui/editor"
import {
  MediaExtension,
  MediaPreviewGallery,
  MediaPreviewTrigger,
} from "@yopem-ui/editor/media"
import { useReducer, useState, type ComponentProps } from "react"
import { createPortal } from "react-dom"

const styles = stylex.create({
  foreignFrame: {
    blockSize: "24rem",
    borderColor: tokens["--border"],
    borderStyle: "solid",
    borderWidth: 1,
    inlineSize: "100%",
  },
})

const extensions = [MediaExtension]

const foreignPreviewImages = [
  {
    id: "foreign-mark",
    src: "https://ui.yopem.com/favicon.svg",
    alt: "Yopem UI mark",
  },
]

function serializeEditorState(_current: string, state: EditorState) {
  return JSON.stringify(state.toJSON())
}

const initialState = JSON.stringify({
  root: {
    direction: null,
    format: "",
    indent: 0,
    type: "root",
    version: 1,
    children: [
      {
        type: "yopem-media",
        version: 1,
        media: {
          kind: "image",
          url: "https://ui.yopem.com/favicon.svg",
          alt: "Yopem UI mark",
          caption: "Yopem UI mark",
          width: 240,
          alignment: "center",
        },
      },
      {
        type: "yopem-media",
        version: 1,
        media: {
          kind: "image",
          url: "https://interactive-examples.mdn.mozilla.net/media/cc0-images/grapefruit-slice.jpg",
          alt: "Grapefruit slice",
          caption: "Grapefruit slice",
          width: 320,
          alignment: "center",
        },
      },
    ],
  },
})

export function PublicMediaPreviewExample() {
  const [editable, toggleEditable] = useReducer(
    (current: boolean) => !current,
    true,
  )

  const [documentState, setDocumentState] = useReducer(
    serializeEditorState,
    initialState,
  )

  return (
    <Stack>
      <Button variant="outline" onClick={toggleEditable}>
        {editable ? "Set read-only" : "Edit media"}
      </Button>
      <EditorRoot
        ariaLabel="Public media preview editor"
        editable={editable}
        extensions={extensions}
        initialState={initialState}
        onChange={setDocumentState}
      >
        <EditorToolbar aria-label="Media preview history">
          <EditorHistoryButton action="undo" />
          <EditorHistoryButton action="redo" />
        </EditorToolbar>
        <EditorContent placeholder="Image preview gallery." />
      </EditorRoot>
      <Box
        render={
          <output
            aria-label="Media document state"
            data-testid="media-document-state"
            data-document={documentState}
          />
        }
      />
      <ForeignDocumentPreview />
    </Stack>
  )
}

function ForeignDocumentPreview() {
  const [foreignBody, setForeignBody] = useState<HTMLElement | null>(null)

  const handleLoad = useStableCallback(function handleLoad(
    event: Parameters<NonNullable<ComponentProps<"iframe">["onLoad"]>>[0],
  ) {
    const frame = event.currentTarget
    const target = frame.contentDocument

    if (!target) {
      setForeignBody(null)

      return
    }

    const source = frame.ownerDocument
    target.documentElement.className = source.documentElement.className
    target.documentElement.lang = source.documentElement.lang || "en"

    for (const attribute of ["data-theme", "dir"] as const) {
      const value = source.documentElement.getAttribute(attribute)

      if (value === null) target.documentElement.removeAttribute(attribute)
      else target.documentElement.setAttribute(attribute, value)
    }

    for (const previous of target.head.querySelectorAll(
      "[data-media-preview-stylesheet]",
    ))
      previous.remove()

    for (const stylesheet of source.querySelectorAll<
      HTMLStyleElement | HTMLLinkElement
    >("style, link[rel='stylesheet']")) {
      const copy = target.importNode(stylesheet, true)
      const href = stylesheet.getAttribute("href")

      if (href !== null)
        copy.setAttribute("href", new URL(href, stylesheet.baseURI).href)
      copy.setAttribute("data-media-preview-stylesheet", "")
      target.head.append(copy)
    }

    setForeignBody(target.body)
  })

  return (
    <>
      <Box
        render={
          <iframe
            title="Foreign document media preview"
            srcDoc='<!doctype html><html lang="en"><head><title>Media preview document</title></head><body></body></html>'
            sandbox="allow-same-origin"
            onLoad={handleLoad}
          />
        }
        xstyle={styles.foreignFrame}
      />
      {foreignBody
        ? createPortal(
            <MediaPreviewGallery images={foreignPreviewImages}>
              <MediaPreviewTrigger imageId="foreign-mark">
                <img
                  src="https://ui.yopem.com/favicon.svg"
                  alt="Yopem UI mark"
                  width={64}
                  height={64}
                />
              </MediaPreviewTrigger>
            </MediaPreviewGallery>,
            foreignBody,
          )
        : null}
    </>
  )
}
