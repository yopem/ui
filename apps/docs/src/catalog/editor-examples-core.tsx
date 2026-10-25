"use client"

import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Clipboard } from "@registry/components/ui/clipboard"
import { Codeblock } from "@registry/components/ui/codeblock"
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@registry/components/ui/collapsible"
import { Heading } from "@registry/components/ui/heading"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import { rewriteImports } from "@registry/source-files"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

import { BasicMarksExample } from "./editor-examples/basic-marks"
import { BasicNodesExample } from "./editor-examples/basic-nodes"
import { ColumnsExample } from "./editor-examples/columns-example"
import { DateExample } from "./editor-examples/date-example"
import { DefaultEditorExample } from "./editor-examples/editor-default"
import { DisabledEditorExample } from "./editor-examples/editor-disabled"
import { FullWidthEditorExample } from "./editor-examples/editor-full-width"
import { MinimalEditorExample } from "./editor-examples/installation-next-01-editor"
import { MarksSetupExample } from "./editor-examples/installation-next-02-marks"
import { ElementsSetupExample } from "./editor-examples/installation-next-03-elements"
import { LinkExample } from "./editor-examples/link"
import { MathExample } from "./editor-examples/math-example"
import { MediaExample } from "./editor-examples/media-example"
import { VersionHistoryExample } from "./editor-examples/public-history"
import {
  ControlledEditorExample,
  MultipleEditorsExample,
} from "./editor-examples/public-hosts"

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
  {
    slug: "equation",
    sourceFile: "math-example",
    title: "Equations",
    Component: MathExample,
    items: ["editor", "editor-math", "editor-typeahead"],
    description:
      "Edit inline and block equations. Use slash commands and combine math with native tables and code blocks.",
    limits:
      "TeX input has a 4096-character limit. Browser behavior and consumer installation remain unverified.",
  },
  {
    slug: "column",
    sourceFile: "columns-example",
    title: "Columns",
    Component: ColumnsExample,
    items: ["editor", "editor-columns"],
    description:
      "Edit seeded left and right columns. Compare editable column borders with read-only mode.",
    limits:
      "Generic editor-document converters do not support column nodes. The native extension supports JSON and HTML conversion.",
  },
  {
    slug: "date",
    sourceFile: "date-example",
    title: "Inline dates",
    Component: DateExample,
    items: ["editor", "editor-date"],
    description:
      "Choose a date in the inline calendar. Keep nearby text editable and use editor history.",
    limits:
      "Dates use YYYY-MM-DD values. Generic editor-document converters do not support date nodes.",
  },
  {
    slug: "media",
    sourceFile: "media-example",
    title: "Media",
    Component: MediaExample,
    items: ["editor", "editor-media"],
    description:
      "Insert validated HTTPS media URLs. Edit image captions and widths. Render supported audio, video, file, and provider content.",
    limits:
      "A host must supply an upload callback. Host code sets size, type, and quota limits. Batch upload is not built in. Twitter embeds are not supported. Media JSON and tagged HTML keep metadata.",
  },
  {
    slug: "controlled",
    sourceFile: "public-hosts",
    title: "Controlled document replacement",
    Component: ControlledEditorExample,
    items: ["editor"],
    description:
      "Replace or reset a native document. Return focus to its start or end. Edit a document after local async initialization.",
    limits:
      "Replacement keeps local undo history. Async initialization uses a fixed local Promise, not persistence or a network service.",
  },
  {
    slug: "multiple-editors",
    sourceFile: "public-hosts",
    title: "Independent editors",
    Component: MultipleEditorsExample,
    items: ["editor"],
    description:
      "Edit two independent roots. Keep their formatting, history, content, and read-only state separate.",
    limits:
      "The roots do not share document state. This is not a collaboration example.",
  },
  {
    slug: "version-history",
    sourceFile: "public-history",
    title: "Local revision history",
    Component: VersionHistoryExample,
    items: ["editor", "editor-review", "native-select"],
    description:
      "Save immutable snapshots. Inspect an earlier revision without changing the current document. Compare inserted, removed, and updated blocks and text.",
    limits:
      "History stays in memory and holds at most 20 snapshots, each within 1 MiB and 200 top-level blocks. Long or multiline text uses whole-block differences. No server history is configured.",
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
  const sourceFile = "sourceFile" in example ? example.sourceFile : example.slug
  const source = sources[`./editor-examples/${sourceFile}.tsx`]

  if (!source)
    throw new Error(`Missing core editor example source: ${sourceFile}`)

  return {
    slug: example.slug,
    title: example.title,
    installNames: [...example.items],
    filename: `${sourceFile}.tsx`,
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
        Open one live preview at a time. Closing a preview resets its local
        document. Copy source without opening the preview.
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
                <Collapsible>
                  <CollapsibleTrigger render={<Button variant="outline" />}>
                    Live preview
                  </CollapsibleTrigger>
                  <CollapsiblePanel>
                    <Box xstyle={styles.preview}>
                      <Component />
                    </Box>
                  </CollapsiblePanel>
                </Collapsible>
                <Clipboard
                  value={documentation.source}
                  aria-label="Copy source"
                >
                  Copy source
                </Clipboard>
                <Collapsible>
                  <CollapsibleTrigger render={<Button variant="outline" />}>
                    View source
                  </CollapsibleTrigger>
                  <CollapsiblePanel xstyle={styles.details}>
                    <Codeblock>{documentation.source}</Codeblock>
                  </CollapsiblePanel>
                </Collapsible>
              </Stack>
            </Box>
          )
        },
      )}
    </Stack>
  )
}
