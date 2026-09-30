import type { MDXComponents } from "mdx/types"
import type { ComponentProps, ReactNode } from "react"

import { Box } from "@registry/components/ui/box"
import { Heading } from "@registry/components/ui/heading"
import { Link } from "@registry/components/ui/link"
import { Text } from "@registry/components/ui/text"
import { isString } from "@registry/lib/stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { isValidElement } from "react"

import { CopyableCode } from "./code-block"
import { DocumentationLayout } from "./docs-layout"
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "./docs-page"
import { guideToc, headingId } from "./guide-toc"

const styles = stylex.create({
  h2: {
    fontFamily: tokens["--font-heading"],
    fontSize: "1.5rem",
    fontWeight: 650,
    letterSpacing: "-0.025em",
    lineHeight: 1.3,
    marginBlockStart: "3rem",
    marginBlockEnd: "1rem",
    scrollMarginBlockStart: "6rem",
  },
  h3: {
    fontFamily: tokens["--font-heading"],
    fontSize: "1.2rem",
    fontWeight: 600,
    lineHeight: 1.4,
    marginBlockStart: "2rem",
    marginBlockEnd: "0.75rem",
    scrollMarginBlockStart: "6rem",
  },
  pre: {
    backgroundColor: tokens["--code"],
    color: tokens["--code-foreground"],
    paddingBlock: "1.25rem",
    paddingInline: "1.25rem",
    borderRadius: tokens["--radius-lg"],
    overflowX: "auto",
    fontFamily: tokens["--font-mono"],
    fontSize: "0.8125rem",
    lineHeight: 1.75,
    marginBlock: "1.5rem",
  },
  paragraph: { marginBlock: "1rem", lineHeight: 1.8 },
  link: {
    color: tokens["--foreground"],
    textDecoration: "underline",
    textDecorationColor: {
      default: tokens["--border"],
      ":is(:hover, [data-hover]):not(:disabled, [disabled], [aria-disabled=true], [data-disabled])":
        tokens["--foreground"],
    },
    textUnderlineOffset: "0.25em",
    borderRadius: tokens["--radius-sm"],
    outlineColor: {
      ":is(:focus-visible, [data-focus-visible])": tokens["--ring"],
    },
    outlineStyle: { ":is(:focus-visible, [data-focus-visible])": "solid" },
    outlineWidth: { ":is(:focus-visible, [data-focus-visible])": 2 },
    outlineOffset: { ":is(:focus-visible, [data-focus-visible])": 4 },
  },
  ul: {
    listStyleType: "disc",
    paddingInlineStart: "1.5rem",
    marginBlock: "1rem",
  },
  ol: {
    listStyleType: "decimal",
    paddingInlineStart: "1.5rem",
    marginBlock: "1rem",
  },
  li: {
    paddingInlineStart: "0.25rem",
    marginBlock: "0.5rem",
    lineHeight: 1.75,
  },
  strong: { fontWeight: 600, color: tokens["--foreground"] },
  code: {
    fontFamily: tokens["--font-mono"],
    fontSize: "0.875em",
    backgroundColor: tokens["--code"],
    color: tokens["--code-foreground"],
    borderRadius: tokens["--radius-sm"],
    paddingBlock: "0.15rem",
    paddingInline: "0.35rem",
    overflowWrap: "anywhere",
  },
})

function GuideH2({ children, id }: ComponentProps<"h2">) {
  return (
    <Heading
      as="h2"
      id={id ?? (isString(children) ? headingId(children) : undefined)}
      xstyle={styles.h2}
    >
      {children}
    </Heading>
  )
}

function GuideH3({ children, id }: ComponentProps<"h3">) {
  return (
    <Heading
      as="h3"
      id={id ?? (isString(children) ? headingId(children) : undefined)}
      xstyle={styles.h3}
    >
      {children}
    </Heading>
  )
}

function GuideCode({ children }: { children?: ReactNode }) {
  if (isValidElement<{ children?: ReactNode }>(children)) {
    const code = children.props.children

    if (isString(code)) return <CopyableCode code={code} />
  }

  return (
    <Box as="pre" xstyle={styles.pre}>
      {children}
    </Box>
  )
}

const guideComponents: MDXComponents = {
  h2: GuideH2,
  h3: GuideH3,
  p: ({ children }) => <Text xstyle={styles.paragraph}>{children}</Text>,
  a: ({ children, href, title, target, rel }) => (
    <Link
      xstyle={styles.link}
      href={href}
      title={title}
      target={target}
      rel={rel}
    >
      {children}
    </Link>
  ),
  ul: ({ children }) => (
    <Box as="ul" xstyle={styles.ul}>
      {children}
    </Box>
  ),
  ol: ({ children }) => (
    <Box as="ol" xstyle={styles.ol}>
      {children}
    </Box>
  ),
  li: ({ children }) => (
    <Box as="li" xstyle={styles.li}>
      {children}
    </Box>
  ),
  strong: ({ children }) => (
    <Box as="strong" xstyle={styles.strong}>
      {children}
    </Box>
  ),
  code: ({ children }) => (
    <Box as="code" xstyle={styles.code}>
      {children}
    </Box>
  ),
  pre: GuideCode,
}

export function GuidePage({
  title,
  description,
  source,
  Content,
  components,
}: {
  title: string
  description: string
  source: string
  Content: (props: { components?: MDXComponents }) => ReactNode
  components?: MDXComponents
}) {
  return (
    <DocumentationLayout>
      <DocsPage toc={guideToc(source)}>
        <DocsTitle>{title}</DocsTitle>
        <DocsDescription>{description}</DocsDescription>
        <DocsBody>
          <Content components={{ ...guideComponents, ...components }} />
        </DocsBody>
      </DocsPage>
    </DocumentationLayout>
  )
}
