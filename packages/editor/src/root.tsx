"use client"

import type { StyleXComponentProps } from "@registry/lib/stylex"
import type { ComponentProps } from "react"

import { useRender } from "@base-ui/react/use-render"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import { LexicalExtensionComposer } from "@lexical/react/LexicalExtensionComposer"
import { Box } from "@registry/components/ui/box"
import { Stack } from "@registry/components/ui/stack"
import { stylexProps } from "@registry/lib/stylex"
import { createContext, use, useState, useSyncExternalStore } from "react"

import type { EditorProps } from "./extension"

import { createEditorSetup } from "./extension"
import { editorStyles } from "./theme"

export type EditorRootProps = Omit<EditorProps, "placeholder"> &
  Omit<ComponentProps<typeof Stack>, "onChange">

const EditorContext = createContext<ReturnType<
  typeof createEditorSetup
> | null>(null)

export function EditorRoot({
  extensions,
  initialState,
  onChange,
  editable = true,
  ariaLabel = "Rich text editor",
  children,
  ref,
  ...props
}: EditorRootProps) {
  const [setup] = useState(() =>
    createEditorSetup({ initialState, editable, ariaLabel, extensions }),
  )

  function connect(element: HTMLDivElement | null) {
    if (element) return setup.connect(onChange, editable, ariaLabel)
  }

  const root = useRender({
    render: <Stack />,
    ref: [connect, ref ?? null],
    props: { ...props, children },
  })

  return (
    <EditorContext value={setup}>
      <LexicalExtensionComposer
        extension={setup.extension}
        contentEditable={null}
      >
        {root}
      </LexicalExtensionComposer>
    </EditorContext>
  )
}

export function useEditorState() {
  const context = use(EditorContext)

  if (!context) throw new Error("Editor parts must be inside EditorRoot.")

  return useSyncExternalStore(
    context.subscribe,
    context.getSnapshot,
    context.getSnapshot,
  )
}

export function useEditor() {
  const context = use(EditorContext)

  if (!context) throw new Error("useEditor must be inside EditorRoot.")
  const [editor] = useLexicalComposerContext()

  return editor
}

export type EditorContentProps = StyleXComponentProps<
  Omit<
    ComponentProps<typeof ContentEditable>,
    "placeholder" | "aria-placeholder"
  >
> & { placeholder?: string }

export function EditorContent({
  placeholder,
  className,
  xstyle,
  "aria-label": ariaLabel,
  ...props
}: EditorContentProps) {
  const state = useEditorState()

  return (
    <Box xstyle={editorStyles.surface}>
      <ContentEditable
        {...props}
        data-slot="editor-content"
        {...stylexProps(className, editorStyles.content, xstyle)}
        aria-label={ariaLabel ?? state.ariaLabel}
        aria-readonly={!state.editable}
        aria-multiline="true"
        aria-placeholder={placeholder ?? ""}
        placeholder={<Box xstyle={editorStyles.placeholder}>{placeholder}</Box>}
      />
    </Box>
  )
}
