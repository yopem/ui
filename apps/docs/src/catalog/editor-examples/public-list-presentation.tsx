"use client"

import type { EditorListMarker } from "@yopem-ui/editor/list-presentation"
import type { KeyboardEvent } from "react"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html"
import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Fieldset, FieldsetLegend } from "@registry/components/ui/fieldset"
import { Text } from "@registry/components/ui/text"
import { Wrap } from "@registry/components/ui/wrap"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import {
  EditorContent,
  EditorHistoryButton,
  EditorIndentButton,
  EditorListButton,
  EditorRoot,
  EditorToolbar,
  useEditor,
} from "@yopem-ui/editor"
import {
  EDITOR_LIST_MARKER_ATTRIBUTE,
  EditorListMarkerControl,
  EditorListStartControl,
  editorListMarkerSchema,
  isEditorListMarkerForType,
  isEditorListStart,
  parseEditorListStartHTML,
  EditorListPresentationExtension,
} from "@yopem-ui/editor/list-presentation"
import { $getRoot, HISTORY_PUSH_TAG } from "lexical"
import { useState } from "react"
import { z } from "zod"

const extensions = [EditorListPresentationExtension]

const initialState = JSON.stringify({
  root: {
    children: [
      {
        children: [
          {
            children: [
              {
                detail: 0,
                format: 0,
                mode: "normal",
                style: "",
                text: "Bullet one",
                type: "text",
                version: 1,
              },
            ],
            direction: null,
            format: "",
            indent: 0,
            type: "listitem",
            value: 1,
            version: 1,
          },
          {
            children: [
              {
                detail: 0,
                format: 0,
                mode: "normal",
                style: "",
                text: "Parent item",
                type: "text",
                version: 1,
              },
              {
                children: [
                  {
                    children: [
                      {
                        detail: 0,
                        format: 0,
                        mode: "normal",
                        style: "",
                        text: "Nested ordered item",
                        type: "text",
                        version: 1,
                      },
                    ],
                    direction: null,
                    format: "",
                    indent: 0,
                    type: "listitem",
                    value: -2,
                    version: 1,
                  },
                ],
                direction: null,
                format: "",
                indent: 0,
                listType: "number",
                start: -2,
                tag: "ol",
                type: "list",
                version: 1,
              },
            ],
            direction: null,
            format: "",
            indent: 0,
            type: "listitem",
            value: 2,
            version: 1,
          },
        ],
        direction: null,
        format: "",
        indent: 0,
        listType: "bullet",
        start: 1,
        tag: "ul",
        type: "list",
        version: 1,
      },
      {
        children: [
          {
            children: [
              {
                detail: 0,
                format: 0,
                mode: "normal",
                style: "",
                text: "Ordered item",
                type: "text",
                version: 1,
              },
            ],
            direction: null,
            format: "",
            indent: 0,
            type: "listitem",
            value: 3,
            version: 1,
          },
        ],
        direction: null,
        format: "",
        indent: 0,
        listType: "number",
        start: 3,
        tag: "ol",
        type: "list",
        version: 1,
      },
      {
        children: [
          {
            checked: false,
            children: [
              {
                detail: 0,
                format: 0,
                mode: "normal",
                style: "",
                text: "Checklist item",
                type: "text",
                version: 1,
              },
            ],
            direction: null,
            format: "",
            indent: 0,
            type: "listitem",
            value: 1,
            version: 1,
          },
        ],
        direction: null,
        format: "",
        indent: 0,
        listType: "check",
        start: 1,
        tag: "ul",
        type: "list",
        version: 1,
      },
    ],
    direction: null,
    format: "",
    indent: 0,
    type: "root",
    version: 1,
  },
})

const replacementState = JSON.stringify({
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "Replacement paragraph",
            type: "text",
            version: 1,
          },
        ],
        direction: null,
        format: "",
        indent: 0,
        type: "paragraph",
        version: 1,
      },
    ],
    direction: null,
    format: "",
    indent: 0,
    type: "root",
    version: 1,
  },
})

const invalidJSON = JSON.stringify({
  root: {
    children: [
      {
        listType: "bullet",
        type: "list",
        yopemListMarker: "custom-marker",
      },
    ],
  },
})

const invalidHTML = '<ol start="2147483648"><li>Rejected list</li></ol>'

const styles = stylex.create({
  root: {
    boxSizing: "border-box",
    inlineSize: "100%",
    maxInlineSize: "100%",
    minInlineSize: 0,
    overflowWrap: "anywhere",
  },
  content: {
    backgroundColor: tokens["--background"],
    borderColor: tokens["--border"],
    borderRadius: tokens["--radius-md"],
    borderStyle: "solid",
    borderWidth: 1,
    boxSizing: "border-box",
    maxBlockSize: "28rem",
    minBlockSize: "18rem",
    minInlineSize: 0,
    overflowX: "auto",
    overflowY: "auto",
    paddingBlock: `calc(${tokens["--spacing"]} * 3)`,
    paddingInline: `calc(${tokens["--spacing"]} * 3)`,
  },
  output: {
    backgroundColor: tokens["--muted"],
    borderColor: tokens["--border"],
    borderRadius: tokens["--radius-md"],
    borderStyle: "solid",
    borderWidth: 1,
    boxSizing: "border-box",
    maxBlockSize: "12rem",
    maxInlineSize: "100%",
    minInlineSize: 0,
    overflow: "auto",
    overflowWrap: "anywhere",
    paddingBlock: `calc(${tokens["--spacing"]} * 2)`,
    paddingInline: `calc(${tokens["--spacing"]} * 2)`,
    whiteSpace: "pre-wrap",
  },
})

interface LocalSerializedListNode {
  children?: LocalSerializedListNode[]
  listType?: "bullet" | "number" | "check"
  start?: number
  type: string
  yopemListMarker?: EditorListMarker
  $?: { yopemListMarker?: EditorListMarker }
}

const localSerializedListNodeSchema: z.ZodType<LocalSerializedListNode> =
  z.lazy(() =>
    z
      .looseObject({
        children: z.array(localSerializedListNodeSchema).optional(),
        listType: z.enum(["bullet", "number", "check"]).optional(),
        start: z.number().optional(),
        type: z.string(),
        yopemListMarker: editorListMarkerSchema.optional(),
        $: z
          .looseObject({
            yopemListMarker: editorListMarkerSchema.optional(),
          })
          .optional(),
      })
      .superRefine((node, context) => {
        const markers = [node.yopemListMarker, node.$?.yopemListMarker].filter(
          (marker): marker is EditorListMarker => marker !== undefined,
        )

        if (markers.length > 0) {
          if (
            node.type !== "list" ||
            (node.listType !== "bullet" &&
              node.listType !== "number" &&
              node.listType !== "check")
          ) {
            context.addIssue({
              code: "custom",
              message: "List marker is not attached to a native list.",
            })

            return
          }

          const listType = node.listType

          if (
            markers.some(
              (marker) => !isEditorListMarkerForType(marker, listType),
            )
          )
            context.addIssue({
              code: "custom",
              message: "List marker does not match native list type.",
            })
        }

        if (
          node.type === "list" &&
          node.listType === "number" &&
          !isEditorListStart(node.start)
        )
          context.addIssue({
            code: "custom",
            message: "Ordered list start is outside native bounds.",
          })
      }),
  )

const localSerializedEditorStateSchema = z.object({
  root: localSerializedListNodeSchema,
})

function isSupportedLocalListJSON(source: string) {
  const parsed: unknown = JSON.parse(source)

  return localSerializedEditorStateSchema.safeParse(parsed).success
}

function isSupportedLocalListHTML(document: Document) {
  return Array.from(document.querySelectorAll("ol, ul")).every((list) => {
    const markerValue = list.getAttribute(EDITOR_LIST_MARKER_ATTRIBUTE)

    if (markerValue !== null) {
      const marker = editorListMarkerSchema.safeParse(markerValue)

      const listType =
        list.tagName.toLowerCase() === "ol"
          ? "number"
          : list.getAttribute("__lexicallisttype") === "check"
            ? "check"
            : "bullet"

      if (!marker.success || !isEditorListMarkerForType(marker.data, listType))
        return false
    }

    return (
      list.tagName.toLowerCase() !== "ol" ||
      !list.hasAttribute("start") ||
      parseEditorListStartHTML(list.getAttribute("start")) !== undefined
    )
  })
}

function ListPresentationContent({
  editable,
  onToggleEditable,
}: {
  editable: boolean
  onToggleEditable: () => void
}) {
  const editor = useEditor()

  const replaceDocument = useStableCallback(function replaceDocument() {
    editor.setEditorState(editor.parseEditorState(replacementState), {
      tag: HISTORY_PUSH_TAG,
    })
  })

  const handleStartKeyDown = useStableCallback(function handleStartKeyDown(
    event: KeyboardEvent<HTMLInputElement>,
  ) {
    if (
      event.defaultPrevented ||
      !event.altKey ||
      !event.shiftKey ||
      event.code !== "KeyR"
    )
      return

    event.preventDefault()
    replaceDocument()
  })

  const loadInitialDocument = useStableCallback(function loadInitialDocument() {
    editor.setEditorState(editor.parseEditorState(initialState), {
      tag: HISTORY_PUSH_TAG,
    })
  })

  return (
    <>
      <EditorToolbar aria-label="Native list editing">
        <EditorListButton listType="bullet" />
        <EditorListButton listType="number" />
        <EditorListButton listType="check" />
        <EditorIndentButton direction="indent" />
        <EditorIndentButton direction="outdent" />
        <EditorHistoryButton action="undo" />
        <EditorHistoryButton action="redo" />
      </EditorToolbar>
      <EditorContent
        placeholder="Edit the mixed list…"
        xstyle={styles.content}
      />
      <Fieldset>
        <FieldsetLegend>List presentation</FieldsetLegend>
        <Wrap>
          <EditorListMarkerControl />
          <EditorListStartControl onKeyDown={handleStartKeyDown} />
        </Wrap>
      </Fieldset>
      <Text>
        Local roundtrips only. This is not a general-purpose importer.
      </Text>
      <ListPresentationActions
        editable={editable}
        onReplaceDocument={replaceDocument}
        onToggleEditable={onToggleEditable}
        onLoadInitialDocument={loadInitialDocument}
      />
    </>
  )
}

function ListPresentationActions({
  editable,
  onLoadInitialDocument,
  onReplaceDocument,
  onToggleEditable,
}: {
  editable: boolean
  onLoadInitialDocument: () => void
  onReplaceDocument: () => void
  onToggleEditable: () => void
}) {
  const editor = useEditor()
  const [savedJSON, setSavedJSON] = useState("")
  const [savedHTML, setSavedHTML] = useState("")
  const [message, setMessage] = useState("")
  const rejected = message.toLowerCase().includes("rejected")

  const saveJSON = useStableCallback(function saveJSON() {
    setSavedJSON(JSON.stringify(editor.getEditorState().toJSON(), null, 2))
    setMessage("Local JSON saved.")
  })

  function loadJSON(source: string) {
    try {
      if (!isSupportedLocalListJSON(source)) {
        setMessage("Local JSON rejected. Current content stayed unchanged.")

        return
      }

      editor.setEditorState(editor.parseEditorState(source), {
        tag: HISTORY_PUSH_TAG,
      })
      editor.focus()
      setMessage("Local JSON loaded.")
    } catch {
      setMessage("Local JSON rejected. Current content stayed unchanged.")
    }
  }

  const saveHTML = useStableCallback(function saveHTML() {
    setSavedHTML(
      editor.getEditorState().read(() => $generateHtmlFromNodes(editor), {
        editor,
      }),
    )
    setMessage("Local HTML saved.")
  })

  function loadHTML(source: string) {
    const view = editor.getRootElement()?.ownerDocument.defaultView

    if (!view) {
      setMessage("Local HTML rejected. Current content stayed unchanged.")

      return
    }

    const document = new view.DOMParser().parseFromString(source, "text/html")

    if (!isSupportedLocalListHTML(document)) {
      setMessage("Local HTML rejected. Current content stayed unchanged.")

      return
    }

    try {
      editor.update(
        () => {
          const nodes = $generateNodesFromDOM(editor, document)
          $getRoot()
            .clear()
            .append(...nodes)
        },
        { tag: HISTORY_PUSH_TAG },
      )
      editor.focus()
      setMessage("Local HTML loaded.")
    } catch {
      setMessage("Local HTML rejected. Current content stayed unchanged.")
    }
  }

  const loadSavedJSON = useStableCallback(function loadSavedJSON() {
    loadJSON(savedJSON)
  })

  const loadSavedHTML = useStableCallback(function loadSavedHTML() {
    loadHTML(savedHTML)
  })

  const loadInvalidJSON = useStableCallback(function loadInvalidJSON() {
    loadJSON(invalidJSON)
  })

  const loadInvalidHTML = useStableCallback(function loadInvalidHTML() {
    loadHTML(invalidHTML)
  })

  return (
    <>
      <Wrap>
        <Button onClick={saveJSON}>Save local JSON</Button>
        <Button disabled={!editable || !savedJSON} onClick={loadSavedJSON}>
          Load local JSON
        </Button>
        <Button onClick={saveHTML}>Save local HTML</Button>
        <Button disabled={!editable || !savedHTML} onClick={loadSavedHTML}>
          Load local HTML
        </Button>
        <Button disabled={!editable} onClick={onReplaceDocument}>
          Replace document
        </Button>
        <Button disabled={!editable} onClick={onLoadInitialDocument}>
          Load initial document
        </Button>
        <Button onClick={onToggleEditable}>
          {editable ? "Toggle read-only" : "Make editable"}
        </Button>
        <Button onClick={loadInvalidJSON}>Try invalid JSON</Button>
        <Button onClick={loadInvalidHTML}>Try invalid HTML</Button>
      </Wrap>
      {message ? (
        <Text
          aria-live={rejected ? "assertive" : "polite"}
          role={rejected ? "alert" : "status"}
        >
          {message}
        </Text>
      ) : null}
      <Box
        render={<pre data-testid="list-presentation-json-output" />}
        xstyle={styles.output}
      >
        {savedJSON || "Save local JSON to show the snapshot."}
      </Box>
      <Box
        render={<pre data-testid="list-presentation-html-output" />}
        xstyle={styles.output}
      >
        {savedHTML || "Save local HTML to show the snapshot."}
      </Box>
    </>
  )
}

export function PublicListPresentationExample() {
  const [editable, setEditable] = useState(true)

  const toggleEditable = useStableCallback(function toggleEditable() {
    setEditable((current) => !current)
  })

  return (
    <EditorRoot
      ariaLabel="List presentation editor"
      editable={editable}
      extensions={extensions}
      initialState={initialState}
      xstyle={styles.root}
    >
      <ListPresentationContent
        editable={editable}
        onToggleEditable={toggleEditable}
      />
    </EditorRoot>
  )
}
