"use client"

import { ScrollArea } from "@registry/components/ui/scroll-area"
import { tokens } from "@registry/styles/tokens.stylex"
import { Suspense } from "react"

import { Box } from "@/components/ui/box"
import { Flex } from "@/components/ui/flex"
import { Heading } from "@/components/ui/heading"

import type { CatalogPreview } from "./components"

import { CopyableCode } from "./code-block"
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
    <Box as="section" marginBlock={"2rem"} minInlineSize={0}>
      <Heading as="h3" marginBlock={"0 0.75rem"}>
        {preview.title}
      </Heading>
      <ScrollArea
        backgroundColor={tokens["--background"]}
        borderColor={tokens["--border"]}
        borderRadius={tokens["--radius-lg"]}
        borderStyle={"solid"}
        borderWidth={1}
        minBlockSize={"12rem"}
        borderEndStartRadius={0}
        borderEndEndRadius={0}
        aria-label={`${preview.title} live preview`}
        clampContentMinWidth={false}
        overscrollContain
      >
        <Flex
          alignItems={"center"}
          display={"flex"}
          gap={"1rem"}
          justifyContent={"center"}
          minBlockSize={"12rem"}
          padding={"1.5rem"}
        >
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
