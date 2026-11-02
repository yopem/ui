"use client"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Field, FieldLabel } from "@registry/components/ui/field"
import { Heading } from "@registry/components/ui/heading"
import { Input } from "@registry/components/ui/input"
import { Slider } from "@registry/components/ui/slider"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import {
  EditorContent,
  EditorFormatButton,
  EditorHistoryButton,
  EditorRoot,
  EditorToolbar,
} from "@yopem-ui/editor"
import { BoldIcon, ItalicIcon, Redo2Icon, Undo2Icon } from "lucide-react"
import { useId, useRef, useState, type SyntheticEvent } from "react"
import { createPortal } from "react-dom"

const initialDocument = JSON.stringify({
  root: {
    type: "root",
    version: 1,
    direction: null,
    format: "",
    indent: 0,
    children: [
      {
        type: "paragraph",
        version: 1,
        direction: null,
        format: "",
        indent: 0,
        children: [
          {
            type: "text",
            version: 1,
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "Edit inside this same-origin frame.",
          },
        ],
      },
    ],
  },
})

const previewWidths = [320, 480, 640, 800, 960] as const

type PreviewWidth = (typeof previewWidths)[number]

const styles = stylex.create({
  viewport: { maxInlineSize: "100%" },
  frame: {
    blockSize: "24rem",
    borderColor: tokens["--border"],
    borderRadius: tokens["--radius-md"],
    borderStyle: "solid",
    borderWidth: 1,
    display: "block",
    maxInlineSize: "100%",
  },
  width320: { inlineSize: 320 },
  width480: { inlineSize: 480 },
  width640: { inlineSize: 640 },
  width800: { inlineSize: 800 },
  width960: { inlineSize: 960 },
  frameBody: {
    backgroundColor: tokens["--background"],
    color: tokens["--foreground"],
    fontFamily: tokens["--font-sans"],
    margin: 0,
    minBlockSize: "100vh",
  },
  frameRoot: {
    minBlockSize: "100%",
    padding: `calc(${tokens["--spacing"]} * 4)`,
  },
})

const frameWidthStyles = {
  320: styles.width320,
  480: styles.width480,
  640: styles.width640,
  800: styles.width800,
  960: styles.width960,
}

export function PublicIframeExample() {
  const widthLabelId = useId()
  const preparedDocument = useRef<Document | null>(null)
  const preparedCleanup = useRef<(() => void) | null>(null)
  const [previewWidth, setPreviewWidth] = useState<PreviewWidth>(640)
  const [frameBody, setFrameBody] = useState<HTMLElement | null>(null)

  function prepareFrame(frame: HTMLIFrameElement | null) {
    if (!frame) return

    const frameDocument = frame.contentDocument

    if (!frameDocument) return

    if (preparedDocument.current === frameDocument) {
      setFrameBody(frameDocument.body)

      return
    }

    const frameHead = frameDocument.head
    const frameBodyElement = frameDocument.body

    if (!frameHead || !frameBodyElement) return

    const ownerFrame = frame
    const targetDocument = frameDocument

    frameDocument.title = "Isolated editor document"

    preparedCleanup.current?.()

    function copyTheme() {
      const source = ownerFrame.ownerDocument.documentElement
      targetDocument.documentElement.className = source.className

      for (const attribute of ["data-theme", "dir", "lang"] as const) {
        const value = source.getAttribute(attribute)

        if (value === null)
          targetDocument.documentElement.removeAttribute(attribute)
        else targetDocument.documentElement.setAttribute(attribute, value)
      }
    }

    const ownedStyles: Node[] = []

    function copyStyles() {
      for (const stylesheet of ownedStyles.splice(0))
        stylesheet.parentNode?.removeChild(stylesheet)

      const LinkConstructor =
        ownerFrame.ownerDocument.defaultView?.HTMLLinkElement

      for (const stylesheet of ownerFrame.ownerDocument.head.querySelectorAll<
        HTMLLinkElement | HTMLStyleElement
      >('link[rel="stylesheet"], style')) {
        const copy = stylesheet.cloneNode(true)

        if (
          LinkConstructor &&
          stylesheet instanceof LinkConstructor &&
          copy instanceof LinkConstructor
        )
          copy.href = stylesheet.href
        frameHead.append(copy)
        ownedStyles.push(copy)
      }
    }

    copyTheme()
    copyStyles()
    const themeObserver = new MutationObserver(copyTheme)
    themeObserver.observe(ownerFrame.ownerDocument.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "dir", "lang"],
    })
    const styleObserver = new MutationObserver(copyStyles)
    styleObserver.observe(ownerFrame.ownerDocument.head, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["href", "media", "disabled"],
    })

    frameBodyElement.className = stylex.props(styles.frameBody).className ?? ""

    function preventFrameNavigation(event: MouseEvent) {
      const ElementConstructor = targetDocument.defaultView?.Element

      if (
        ElementConstructor &&
        event.target instanceof ElementConstructor &&
        event.target.closest("a[href]")
      )
        event.preventDefault()
    }

    targetDocument.addEventListener("click", preventFrameNavigation, true)
    preparedCleanup.current = function cleanupFrameDocument() {
      themeObserver.disconnect()
      styleObserver.disconnect()
      targetDocument.removeEventListener("click", preventFrameNavigation, true)

      for (const stylesheet of ownedStyles.splice(0))
        stylesheet.parentNode?.removeChild(stylesheet)
    }

    preparedDocument.current = frameDocument
    setFrameBody(frameBodyElement)
  }

  const [attachFrame] = useState(
    () =>
      function attach(frame: HTMLIFrameElement | null) {
        if (!frame) return
        prepareFrame(frame)

        return function detach() {
          preparedCleanup.current?.()
          preparedCleanup.current = null
          preparedDocument.current = null
        }
      },
  )

  const frameLoaded = useStableCallback(function frameLoaded(
    event: SyntheticEvent<HTMLIFrameElement>,
  ) {
    prepareFrame(event.currentTarget)
  })

  const changePreviewWidth = useStableCallback(function changePreviewWidth(
    value: number | readonly number[],
  ) {
    const nextValue = Array.isArray(value) ? value[0] : value
    const nextWidth = previewWidths.find((width) => width === nextValue)

    if (nextWidth !== undefined) setPreviewWidth(nextWidth)
  })

  return (
    <Box
      render={<section aria-labelledby={`${widthLabelId}-title`} />}
      data-testid="public-iframe-example"
    >
      <Stack>
        <Heading id={`${widthLabelId}-title`}>Responsive iframe editor</Heading>
        <Text>
          The parent creates an empty same-origin frame and mounts a native
          Lexical editor inside it. The frame copies generated styles. It is a
          layout boundary, not a security boundary.
        </Text>
        <Field>
          <FieldLabel id={widthLabelId}>Preview width</FieldLabel>
          <Slider
            aria-label="Preview width"
            aria-labelledby={widthLabelId}
            min={320}
            max={960}
            step={160}
            value={previewWidth}
            onValueChange={changePreviewWidth}
          />
          <Box render={<output aria-label="Selected preview width" />}>
            {previewWidth} px
          </Box>
        </Field>
        <Box
          render={<section aria-label="Responsive iframe viewport" />}
          xstyle={styles.viewport}
        >
          <iframe
            ref={attachFrame}
            onLoad={frameLoaded}
            title="Isolated editor preview"
            src="about:blank"
            sandbox="allow-same-origin"
            {...stylex.props(styles.frame, frameWidthStyles[previewWidth])}
          />
        </Box>
        <Field>
          <FieldLabel htmlFor={`${widthLabelId}-paste`}>
            Parent paste target
          </FieldLabel>
          <Input id={`${widthLabelId}-paste`} />
        </Field>
        {frameBody
          ? createPortal(
              <Box
                render={<main aria-label="Isolated editor document" />}
                xstyle={styles.frameRoot}
              >
                <Heading render={<h1>Isolated editor document</h1>} />
                <EditorRoot
                  ariaLabel="Isolated editor"
                  initialState={initialDocument}
                >
                  <EditorToolbar aria-label="Isolated editor controls">
                    <EditorFormatButton
                      format="bold"
                      title="Bold"
                      render={<Button variant="ghost" size="icon-sm" />}
                    >
                      <BoldIcon aria-hidden="true" size={16} />
                    </EditorFormatButton>
                    <EditorFormatButton
                      format="italic"
                      title="Italic"
                      render={<Button variant="ghost" size="icon-sm" />}
                    >
                      <ItalicIcon aria-hidden="true" size={16} />
                    </EditorFormatButton>
                    <EditorHistoryButton
                      action="undo"
                      aria-label="Undo"
                      title="Undo"
                      render={<Button variant="ghost" size="icon-sm" />}
                    >
                      <Undo2Icon aria-hidden="true" size={16} />
                    </EditorHistoryButton>
                    <EditorHistoryButton
                      action="redo"
                      aria-label="Redo"
                      title="Redo"
                      render={<Button variant="ghost" size="icon-sm" />}
                    >
                      <Redo2Icon aria-hidden="true" size={16} />
                    </EditorHistoryButton>
                  </EditorToolbar>
                  <EditorContent placeholder="Write in this frame…" />
                </EditorRoot>
              </Box>,
              frameBody,
            )
          : null}
      </Stack>
    </Box>
  )
}
