import type { SourceItem } from "@registry/items/types"

import { editorDependency } from "@registry/editor-dependencies"
import { registryDependency } from "@registry/registry-dependencies"

export const editorSearchItem: SourceItem = {
  categories: ["input"],
  dependencies: [
    editorDependency("@lexical/selection"),
    editorDependency("@stylexjs/stylex"),
    editorDependency("lexical"),
  ],
  description:
    "Adds bounded, non-destructive search controls for the native Lexical editor.",
  devDependencies: [],
  docs: {
    api: [
      "EditorSearchRoot",
      "EditorSearchInput",
      "EditorSearchInputProps",
      "EditorSearchPreviousButton",
      "EditorSearchNextButton",
      "EditorSearchButtonProps",
      "EditorSearchStatus",
      "EditorSearchViewport",
      "EditorSearchTextNode",
      "EditorSearchMatch",
      "EditorSearchResult",
      "EDITOR_SEARCH_QUERY_LIMIT",
      "EDITOR_SEARCH_RESULT_LIMIT",
      "normalizeEditorSearchQuery",
      "findEditorSearchMatches",
    ],
    usage:
      "Compose EditorSearchRoot inside EditorRoot. Place EditorSearchInput, EditorSearchPreviousButton, EditorSearchNextButton, and EditorSearchStatus beside EditorSearchViewport. Render EditorContent inside EditorSearchViewport. Search adds overlays without changing document content. Queries use at most 64 Unicode code points. Results show at most 200 matches. See /editor/search-root.",
  },
  files: ["search.tsx", "search-model.ts"].map((file) => ({
    path: `components/editor/${file}`,
    target: `@/components/editor/${file}`,
    type: "registry:ui",
  })),
  name: "editor-search",
  peerDependencies: [
    registryDependency("react"),
    registryDependency("react-dom"),
  ],
  registryDependencies: [
    "editor",
    "box",
    "button",
    "hstack",
    "input",
    "stack",
    "text",
  ],
  title: "Editor search",
  type: "registry:ui",
}
