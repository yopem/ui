"use client"

import { Box } from "@registry/components/ui/box"
import { Flex } from "@registry/components/ui/flex"
import { Heading } from "@registry/components/ui/heading"
import { ScrollArea } from "@registry/components/ui/scroll-area"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { Suspense } from "react"

import type { CatalogPreview } from "./components"

import { CopyableCode } from "./code-block"

const styles = stylex.create({
  section: { marginBlock: "2rem", minInlineSize: "calc(var(--spacing) * 0)" },
  h3: { marginBlock: "0 0.75rem" },
  scrollArea: {
    backgroundColor: tokens["--background"],
    borderColor: tokens["--border"],
    borderRadius: tokens["--radius-md"],
    borderStyle: "solid",
    borderWidth: 1,
    minBlockSize: "12rem",
    borderEndStartRadius: 0,
    borderEndEndRadius: 0,
  },
  flex: {
    alignItems: "center",
    display: "flex",
    gap: "1rem",
    justifyContent: "center",
    minBlockSize: "12rem",
    paddingBlock: "1.5rem",
    paddingInline: "1.5rem",
  },
})

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
  title,
}: {
  preview: CatalogPreview
  source: string
  title?: string | null
}) {
  const Preview = preview.component

  return (
    <Box render={<section />} xstyle={styles.section}>
      {title !== null ? (
        <Heading
          render={<h3>{title ?? preview.title}</h3>}
          xstyle={styles.h3}
        />
      ) : null}
      <ScrollArea
        xstyle={styles.scrollArea}
        aria-label={`${preview.title} live preview`}
        clampContentMinWidth={false}
        overscrollContain
      >
        <Flex xstyle={styles.flex}>
          <Suspense fallback={null}>
            <Preview />
          </Suspense>
        </Flex>
      </ScrollArea>
      {preview.setupCommand ? (
        <CopyableCode
          code={preview.setupCommand}
          language="shellscript"
          title={`${preview.title} setup`}
        />
      ) : null}
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
