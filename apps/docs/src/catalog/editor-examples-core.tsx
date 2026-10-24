"use client"

import { Box } from "@registry/components/ui/box"
import { Clipboard } from "@registry/components/ui/clipboard"
import { Codeblock } from "@registry/components/ui/codeblock"
import { Heading } from "@registry/components/ui/heading"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import { rewriteImports } from "@registry/source-files"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

import { BasicMarksExample } from "./editor-examples/basic-marks"
import { BasicNodesExample } from "./editor-examples/basic-nodes"
import { DefaultEditorExample } from "./editor-examples/editor-default"
import { DisabledEditorExample } from "./editor-examples/editor-disabled"
import { FullWidthEditorExample } from "./editor-examples/editor-full-width"
import { MinimalEditorExample } from "./editor-examples/installation-next-01-editor"
import { MarksSetupExample } from "./editor-examples/installation-next-02-marks"
import { ElementsSetupExample } from "./editor-examples/installation-next-03-elements"
import { LinkExample } from "./editor-examples/link"

const sources = import.meta.glob<string>("./editor-examples/*.tsx", {
  query: "?raw",
  import: "default",
  eager: true,
})

const examples = [
  {
    slug: "basic-marks",
    title: "Basic marks",
    Component: BasicMarksExample,
    items: ["editor"],
    description:
      "Combine text marks. Use the toolbar or native bold, italic, and underline shortcuts.",
    limits:
      "Keyboard-label text remains ordinary editable text. The editor has no keyboard-label mark.",
  },
  {
    slug: "basic-nodes",
    title: "Basic nodes",
    Component: BasicNodesExample,
    items: ["editor"],
    description:
      "Change headings, paragraphs, quotes, and text marks in one document.",
    limits:
      "Horizontal rules use the installed native HorizontalRuleExtension and a local toolbar control. This does not add a house Editor API.",
  },
  {
    slug: "link",
    title: "Links",
    Component: LinkExample,
    items: ["editor"],
    description:
      "Select text. Add, change, or remove a safe URL. Paste a safe URL over selected text to keep its label.",
    limits:
      "Accepted URL schemes are HTTP, HTTPS, mailto, and tel. Relative URLs are not accepted.",
  },
  {
    slug: "installation-next-01-editor",
    title: "Minimal editor setup",
    Component: MinimalEditorExample,
    items: ["editor"],
    description:
      "Start with one empty editable surface. Native rich-text shortcuts work without a toolbar.",
    limits:
      "This client composition is framework-independent. It does not configure a Next.js application.",
  },
  {
    slug: "installation-next-02-marks",
    title: "Marks setup",
    Component: MarksSetupExample,
    items: ["editor"],
    description:
      "Start with formatted text. Compose bold, italic, underline, undo, and redo controls.",
    limits:
      "The toolbar shows selected controls. EditorRoot still registers its standard native extensions.",
  },
  {
    slug: "installation-next-03-elements",
    title: "Elements setup",
    Component: ElementsSetupExample,
    items: ["editor"],
    description:
      "Load native heading, quote, paragraph, and mark state. Change selected content with focused controls.",
    limits: "The seed uses Lexical JSON, not Slate or Plate JSON.",
  },
  {
    slug: "editor-default",
    title: "Default editor",
    Component: DefaultEditorExample,
    items: ["editor"],
    description:
      "Use the house Editor preset with its default toolbar, editable surface, and history.",
    limits:
      "This is the house preset, not the full Plate EditorKit. Optional editor features are not included.",
  },
  {
    slug: "editor-disabled",
    title: "Disabled editor composition",
    Component: DisabledEditorExample,
    items: ["editor"],
    description:
      "Show an empty non-editable surface with disabled controls, disabled semantics, and no editor tab stop.",
    limits:
      "Editor has no disabled prop. This composition uses editable=false, aria-disabled, and tabIndex=-1. It is not a native disabled form field.",
  },
  {
    slug: "editor-full-width",
    title: "Full-width editor",
    Component: FullWidthEditorExample,
    items: ["editor", "container"],
    description:
      "Use the house preset inside a fluid Container. The editor fills the available parent width.",
    limits:
      "Parent layout still bounds the width. This is not the full Plate EditorKit or a fullWidth editor variant.",
  },
] as const

const styles = stylex.create({
  section: {
    borderBlockStartWidth: 1,
    borderBlockStartStyle: "solid",
    borderBlockStartColor: tokens["--border"],
    paddingBlock: `calc(${tokens["--spacing"]} * 6)`,
  },
  preview: { minInlineSize: 0 },
  details: { minInlineSize: 0 },
})

export function getCoreEditorExampleSource(slug: string) {
  const example = examples.find((entry) => entry.slug === slug)

  if (!example) return null
  const source = sources[`./editor-examples/${example.slug}.tsx`]

  if (!source) throw new Error(`Missing core editor example source: ${slug}`)

  return {
    slug: example.slug,
    title: example.title,
    installNames: [...example.items],
    filename: `${example.slug}.tsx`,
    source: rewriteImports(source),
    limits: example.limits,
    status: "internal-pending" as const,
  }
}

export function getCoreEditorExamples() {
  return examples.map(({ slug, title, description, limits, items }) => ({
    slug,
    title,
    description,
    limits,
    installNames: [...items],
    url: `/editor/examples#${slug}`,
  }))
}

export function getCoreEditorExamplesMarkdown() {
  return [
    "# Editor examples",
    ...getCoreEditorExamples().map((example) => {
      const documentation = getCoreEditorExampleSource(example.slug)

      if (!documentation)
        throw new Error(`Missing core editor example: ${example.slug}`)

      return [
        `## ${example.title}`,
        example.description,
        example.limits,
        `Required registry items: ${example.installNames.join(", ")}`,
        `\`\`\`tsx\n${documentation.source}\n\`\`\``,
      ].join("\n\n")
    }),
  ].join("\n\n")
}

export function CoreEditorExamplesGallery() {
  return (
    <Stack data-testid="editor-examples-core">
      <Heading>Core compositions</Heading>
      <Text>
        These native Lexical compositions use house Editor APIs. Browser
        acceptance and consumer installation checks have not run.
      </Text>
      <Text>
        Install each example's listed registry items first. Keep the generated
        StyleX setup and application fonts loaded. Copy one complete file. Each
        file exports a named React component and includes its own seed when
        needed.
      </Text>
      {examples.map(
        ({ slug, title, description, limits, Component, items }) => {
          const documentation = getCoreEditorExampleSource(slug)

          if (!documentation)
            throw new Error(`Missing core editor example: ${slug}`)

          return (
            <Box
              key={slug}
              render={<section aria-labelledby={`${slug}-title`} />}
              id={slug}
              data-testid={`editor-example-${slug}`}
              xstyle={styles.section}
            >
              <Stack>
                <Heading id={`${slug}-title`}>{title}</Heading>
                <Text>{description}</Text>
                <Text>{limits}</Text>
                <Text>Required registry items: {items.join(", ")}</Text>
                <Box xstyle={styles.preview}>
                  <Component />
                </Box>
                <Clipboard
                  value={documentation.source}
                  aria-label="Copy source"
                >
                  Copy source
                </Clipboard>
                <Box render={<details />} xstyle={styles.details}>
                  <summary>View source</summary>
                  <Codeblock>{documentation.source}</Codeblock>
                </Box>
              </Stack>
            </Box>
          )
        },
      )}
    </Stack>
  )
}
