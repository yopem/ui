"use client"

import { HStack } from "@registry/components/ui/hstack"
import { EditorSearchInput, EditorSearchStatus } from "@yopem-ui/editor/search"

import { SearchExample } from "@/catalog/editor-preview-compositions/search"

export function Preview() {
  return (
    <SearchExample>
      <EditorSearchInput placeholder="Search the text…" />
      <HStack>
        <EditorSearchStatus />
      </HStack>
    </SearchExample>
  )
}
