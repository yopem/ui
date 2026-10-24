"use client"

import * as stylex from "@stylexjs/stylex"
import { EditorRoot } from "@yopem-ui/editor"
import {
  createEditorTypeahead,
  EditorTypeahead,
} from "@yopem-ui/editor/typeahead"
import { useState } from "react"

export function Preview() {
  const [controller] = useState(() =>
    createEditorTypeahead({
      mentions: {
        load(query, signal) {
          signal.throwIfAborted()

          return Promise.resolve(
            [{ id: "ada", label: "Ada" }].filter((person) =>
              person.label.toLowerCase().includes(query.toLowerCase()),
            ),
          )
        },
      },
    }),
  )

  const [extensions] = useState(() => [controller.extension])

  return (
    <EditorRoot
      ariaLabel="EditorTypeahead preview"
      extensions={extensions}
      xstyle={styles.root}
    >
      <EditorTypeahead
        controller={controller}
        placeholder="Type /, @Ada, or :smile."
      />
    </EditorRoot>
  )
}

const styles = stylex.create({ root: { inlineSize: "100%" } })
