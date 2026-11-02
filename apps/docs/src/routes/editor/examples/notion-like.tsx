import { Box } from "@registry/components/ui/box"
import { Heading } from "@registry/components/ui/heading"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { Link, createFileRoute } from "@tanstack/react-router"

import { NotionLikeExample } from "@/catalog/editor-examples/notion-like"
import { createSeo } from "@/lib/seo"

const styles = stylex.create({
  page: {
    minBlockSize: "100dvh",
    backgroundColor: tokens["--background"],
    color: tokens["--foreground"],
  },
  title: {
    position: "absolute",
    inlineSize: 1,
    blockSize: 1,
    overflow: "hidden",
    clipPath: "inset(50%)",
    whiteSpace: "nowrap",
  },
  back: {
    position: "fixed",
    insetBlockStart: 0,
    insetInlineStart: 0,
    zIndex: 10,
    inlineSize: { default: 1, ":focus-visible": "auto" },
    blockSize: { default: 1, ":focus-visible": "auto" },
    overflow: { default: "hidden", ":focus-visible": "visible" },
    clipPath: { default: "inset(50%)", ":focus-visible": "none" },
    display: "block",
    paddingBlock: {
      default: 0,
      ":focus-visible": `calc(${tokens["--spacing"]} * 3)`,
    },
    paddingInline: {
      default: 0,
      ":focus-visible": `calc(${tokens["--spacing"]} * 4)`,
    },
    color: tokens["--foreground"],
    backgroundColor: tokens["--background"],
    outlineColor: tokens["--ring"],
    outlineStyle: { default: null, ":focus-visible": "solid" },
    outlineWidth: { default: null, ":focus-visible": 2 },
    outlineOffset: 2,
  },
})

export const Route = createFileRoute("/editor/examples/notion-like")({
  head: () =>
    createSeo({
      title: "Notion-like workspace · Yopem UI",
      description:
        "Edit thirteen local pages with Lexical and Yopem UI. Store validated browser drafts or copy active-page JSON.",
      path: "/editor/examples/notion-like",
    }),
  component: NotionWorkspacePage,
})

export function NotionWorkspacePage() {
  return (
    <Box
      render={<main />}
      aria-label="Notion-like workspace"
      xstyle={styles.page}
    >
      <Heading render={<h1>Notion-like workspace</h1>} xstyle={styles.title} />
      <Link
        to="/editor/examples"
        hash="notion-like"
        {...stylex.props(styles.back)}
      >
        Back to editor examples
      </Link>
      <NotionLikeExample />
    </Box>
  )
}
