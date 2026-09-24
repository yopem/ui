"use client"

import { ScrollArea } from "@registry/components/ui/scroll-area"
import * as stylex from "@stylexjs/stylex"
import { Suspense } from "react"

import { Box } from "@/components/ui/box"
import { Flex } from "@/components/ui/flex"
import { Heading } from "@/components/ui/heading"

import type { CatalogPreview } from "./components"

import { CopyableCode } from "./code-block"
import { catalogStyles } from "./docs-styles"
const previewHelpers = Object.entries(
  import.meta.glob<string>("../hooks/*.ts", {
    query: "?raw",
    import: "default",
    eager: true,
  }),
).map(([path, content]) => ({
  name: path.replace("../hooks/", "@/hooks/").replace(/\.ts$/, ""),
  path: path.replace("../hooks/", "src/hooks/"),
  content,
}))

export function PreviewPanel({
  preview,
  source,
}: {
  preview: CatalogPreview
  source: string
}) {
  const Preview = preview.component
  return (
    <Box as="section" {...stylex.props(catalogStyles.previewSection)}>
      <Heading as="h3" {...stylex.props(localStyles.heading)}>
        {preview.title}
      </Heading>
      <ScrollArea
        {...stylex.props(catalogStyles.preview, localStyles.preview)}
        aria-label={`${preview.title} live preview`}
        clampContentMinWidth={false}
        overscrollContain
      >
        <Flex {...stylex.props(catalogStyles.previewContent)}>
          <Suspense fallback={null}>
            <Preview />
          </Suspense>
        </Flex>
      </ScrollArea>
      <PreviewSource name={preview.title} source={source} />
    </Box>
  )
}

function PreviewSource({ name, source }: { name: string; source: string }) {
  return (
    <>
      <CopyableCode code={source} preview title={`${name} source`} />
      {previewHelpers.map((helper) =>
        source.includes(helper.name) ? (
          <CopyableCode
            key={helper.path}
            code={helper.content}
            preview
            title={helper.path}
          />
        ) : null,
      )}
    </>
  )
}

const localStyles = stylex.create({
  heading: { marginBlock: "0 0.75rem" },
  preview: {
    borderEndStartRadius: 0,
    borderEndEndRadius: 0,
  },
})
