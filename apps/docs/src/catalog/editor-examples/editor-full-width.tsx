"use client"

import { Container } from "@registry/components/ui/container"
import * as stylex from "@stylexjs/stylex"
import { Editor } from "@yopem-ui/editor"

const styles = stylex.create({
  fluid: { paddingInline: 0 },
  editor: { inlineSize: "100%", minInlineSize: 0 },
})

export function FullWidthEditorExample() {
  return (
    <Container fluid xstyle={styles.fluid}>
      <Editor
        ariaLabel="Full-width editor"
        placeholder="Write across the available width…"
        xstyle={styles.editor}
      />
    </Container>
  )
}
