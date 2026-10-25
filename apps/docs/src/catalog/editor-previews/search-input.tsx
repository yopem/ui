"use client"

import { EditorSearchInput } from "@yopem-ui/editor/search"

import { SearchExample } from "@/catalog/editor-preview-compositions/search"

export function Preview() {
  return (
    <SearchExample>
      <EditorSearchInput placeholder="Search the text…" />
    </SearchExample>
  )
}
