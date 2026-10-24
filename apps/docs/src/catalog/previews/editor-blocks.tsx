import { EditorContent, EditorRoot, EditorToolbar } from "@yopem-ui/editor"
import {
  EditorBlocksControls,
  EditorBlocksExtension,
} from "@yopem-ui/editor/blocks"

const extensions = [EditorBlocksExtension]

export function Preview() {
  return (
    <EditorRoot extensions={extensions} ariaLabel="Callouts and toggles">
      <EditorToolbar aria-label="Block controls">
        <EditorBlocksControls />
      </EditorToolbar>
      <EditorContent placeholder="Enter block content" />
    </EditorRoot>
  )
}
