"use client"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html"
import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Checkbox } from "@registry/components/ui/checkbox"
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@registry/components/ui/collapsible"
import { Field, FieldLabel } from "@registry/components/ui/field"
import { NativeSelect } from "@registry/components/ui/native-select"
import { Stack } from "@registry/components/ui/stack"
import { Textarea } from "@registry/components/ui/textarea"
import { Wrap } from "@registry/components/ui/wrap"
import {
  EditorContent,
  EditorHistoryButton,
  EditorRoot,
  EditorToolbar,
  useEditor,
} from "@yopem-ui/editor"
import {
  MediaActions,
  MediaAlignButton,
  MediaCaptionTextarea,
  MediaDeleteButton,
  MediaEditControl,
  createMediaExtension,
  MediaImageResize,
  MediaNode,
  parseMedia,
} from "@yopem-ui/editor/media"
import {
  $createNodeSelection,
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $setSelection,
} from "lexical"
import { useId, useState, type SyntheticEvent } from "react"
import { flushSync } from "react-dom"

const extensions = [
  createMediaExtension({ embedPolicy: { providers: ["vimeo"] } }),
]

const mediaUrls = {
  image:
    "https://interactive-examples.mdn.mozilla.net/media/cc0-images/grapefruit-slice-332-332.jpg",
  video:
    "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  audio:
    "https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3",
  file: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
  embed: "https://vimeo.com/76979871",
}

const initialState = JSON.stringify({
  root: {
    type: "root",
    version: 1,
    format: "",
    indent: 0,
    direction: null,
    children: [
      ...(["image", "video", "audio", "file", "embed"] as const).map(
        (kind) => ({
          type: "yopem-media",
          version: 1,
          media: parseMedia({
            kind,
            url: mediaUrls[kind],
            alt: kind === "image" ? "Grapefruit slice" : "Example media",
          }),
        }),
      ),
      {
        type: "paragraph",
        version: 1,
        format: "",
        indent: 0,
        direction: null,
        children: [
          {
            type: "text",
            version: 1,
            text: "Keep this text.",
            format: 0,
            detail: 0,
            mode: "normal",
            style: "",
          },
        ],
      },
    ],
  },
})

function MediaExampleControls({
  toggleReadOnly,
}: {
  toggleReadOnly: () => void
}) {
  const editor = useEditor()
  const mutationId = useId()
  const phaseId = useId()
  const [veto, setVeto] = useState(false)
  const [json, setJson] = useState("")
  const [html, setHtml] = useState("")
  const [mutation, setMutation] = useState("none")
  const [phase, setPhase] = useState("action")
  const [hiddenControl, setHiddenControl] = useState<string | null>(null)
  const [previewWidth, setPreviewWidth] = useState<number | null>(null)
  const [hostCallbackCount, setHostCallbackCount] = useState(0)

  const handleHostChange = useStableCallback(function handleHostChange() {
    return editor.update(
      () =>
        $getRoot().append(
          $createParagraphNode().append($createTextNode("Host update")),
        ),
      { discrete: true },
    )
  })

  const handleHostCallback = useStableCallback(function handleHostCallback(
    control: string | null,
  ) {
    setHostCallbackCount((count) => count + 1)

    if (mutation === "replace") {
      editor.setEditorState(editor.parseEditorState(initialState))
      editor.update(
        () => {
          const node = $getRoot().getFirstChild()

          if (!(node instanceof MediaNode)) return
          node.setMedia({
            caption: "Host replacement",
            url: "https://media.test/host.svg",
            alignment: "center",
            width: 480,
          })
          const selection = $createNodeSelection()
          selection.add(node.getKey())
          $setSelection(selection)
        },
        { discrete: true },
      )
    } else if (mutation === "select") {
      editor.update(
        () => {
          const node = $getRoot().getChildAtIndex(1)

          if (!(node instanceof MediaNode)) return
          const selection = $createNodeSelection()
          selection.add(node.getKey())
          $setSelection(selection)
        },
        { discrete: true },
      )
    } else if (mutation === "readonly" || mutation === "readonly-cycle") {
      editor.setEditable(false)

      if (mutation === "readonly-cycle") editor.setEditable(true)
    } else if (mutation === "unmount") {
      flushSync(() => setHiddenControl(control))
    }
  })

  const handleAction = useStableCallback(function handleAction(
    event: SyntheticEvent<HTMLElement>,
  ) {
    if (veto) event.preventDefault()

    if (
      event.type === "pointermove" &&
      event.nativeEvent instanceof PointerEvent &&
      event.nativeEvent.buttons !== 1
    )
      return

    if (
      !event.defaultPrevented &&
      (phase === event.type ||
        (phase === "action" &&
          ["click", "change", "keydown"].includes(event.type)))
    )
      handleHostCallback(
        event.currentTarget.getAttribute("data-fixture-control"),
      )
  })

  const handlePreview = useStableCallback(function handlePreview(
    width: number | null,
  ) {
    setPreviewWidth(width)

    if (width !== null && phase === "preview") handleHostCallback("resize")
  })

  const handleExport = useStableCallback(function handleExport() {
    return editor.getEditorState().read(() => {
      setJson(JSON.stringify(editor.getEditorState().toJSON()))
      setHtml($generateHtmlFromNodes(editor))
    })
  })

  const handleReloadJson = useStableCallback(function handleReloadJson() {
    return editor.setEditorState(editor.parseEditorState(json))
  })

  const handleReloadHtml = useStableCallback(function handleReloadHtml() {
    return editor.update(
      () => {
        const document = new DOMParser().parseFromString(html, "text/html")

        const nodes = $generateNodesFromDOM(editor, document)
        $getRoot()
          .clear()
          .append(...nodes)
      },
      { discrete: true },
    )
  })

  return (
    <>
      <Wrap>
        <EditorToolbar>
          <EditorHistoryButton action="undo" />
          <EditorHistoryButton action="redo" />
        </EditorToolbar>
        <Button onClick={toggleReadOnly}>Toggle read only</Button>
        <Button onClick={handleHostChange}>Host change</Button>
      </Wrap>
      <Collapsible>
        <CollapsibleTrigger render={<Button variant="outline" />}>
          Advanced host checks
        </CollapsibleTrigger>
        <CollapsiblePanel>
          <Stack>
            <Field>
              <FieldLabel>Veto media actions</FieldLabel>
              <Checkbox checked={veto} onCheckedChange={setVeto} />
            </Field>
            <Field>
              <FieldLabel htmlFor={mutationId}>
                Host callback mutation
              </FieldLabel>
              <NativeSelect
                id={mutationId}
                value={mutation}
                onChange={(event) => setMutation(event.currentTarget.value)}
              >
                <option value="none">None</option>
                <option value="replace">Replace document</option>
                <option value="select">Select another media</option>
                <option value="readonly">Set read only</option>
                <option value="readonly-cycle">Cycle read only</option>
                <option value="unmount">Unmount current control</option>
              </NativeSelect>
            </Field>
            <Field>
              <FieldLabel htmlFor={phaseId}>Host callback phase</FieldLabel>
              <NativeSelect
                id={phaseId}
                value={phase}
                onChange={(event) => setPhase(event.currentTarget.value)}
              >
                <option value="action">Action</option>
                <option value="change">Native value change</option>
                <option value="pointerdown">Pointer down</option>
                <option value="pointermove">Pointer move</option>
                <option value="pointerup">Pointer up</option>
                <option value="preview">Resize preview</option>
              </NativeSelect>
            </Field>
            <Box render={<output />} aria-label="Host callback count">
              {hostCallbackCount}
            </Box>
            <Box render={<output />} aria-label="Resize preview">
              {previewWidth === null ? "No preview" : `${previewWidth} pixels`}
            </Box>
          </Stack>
        </CollapsiblePanel>
      </Collapsible>
      <MediaActions>
        <Box render={<fieldset />} aria-label="Selected media controls">
          <Wrap>
            {hiddenControl !== "edit" ? (
              <MediaEditControl
                data-fixture-control="edit"
                onClick={handleAction}
              />
            ) : null}
            {hiddenControl !== "align" ? (
              <MediaAlignButton
                data-fixture-control="align"
                alignment="end"
                onClick={handleAction}
              />
            ) : null}
            {hiddenControl !== "delete" ? (
              <MediaDeleteButton
                data-fixture-control="delete"
                onClick={handleAction}
              />
            ) : null}
          </Wrap>
          {hiddenControl !== "caption" ? (
            <Field>
              <FieldLabel>Selected caption</FieldLabel>
              <MediaCaptionTextarea
                data-fixture-control="caption"
                onChange={handleAction}
              />
            </Field>
          ) : null}
          {hiddenControl !== "resize" ? (
            <MediaImageResize
              data-fixture-control="resize"
              onChange={handleAction}
              onKeyDown={handleAction}
              onPointerDown={handleAction}
              onPointerMove={handleAction}
              onPointerUp={handleAction}
              onPreviewWidthChange={handlePreview}
            />
          ) : null}
        </Box>
      </MediaActions>
      <Button onClick={handleExport}>Export media</Button>
      <Field>
        <FieldLabel>Media JSON</FieldLabel>
        <Textarea readOnly value={json} />
      </Field>
      <Field>
        <FieldLabel>Media HTML</FieldLabel>
        <Textarea readOnly value={html} />
      </Field>
      <Wrap>
        <Button disabled={!json} onClick={handleReloadJson}>
          Reload media JSON
        </Button>
        <Button disabled={!html} onClick={handleReloadHtml}>
          Reload media HTML
        </Button>
      </Wrap>
    </>
  )
}

export function Preview() {
  const [editable, setEditable] = useState(true)

  function handleToggleReadOnly() {
    return setEditable((current) => !current)
  }

  return (
    <Box render={<section />} aria-label="Selected media example">
      <EditorRoot
        extensions={extensions}
        initialState={initialState}
        editable={editable}
        ariaLabel="Selected media content"
      >
        <MediaExampleControls toggleReadOnly={handleToggleReadOnly} />
        <EditorContent />
      </EditorRoot>
    </Box>
  )
}
