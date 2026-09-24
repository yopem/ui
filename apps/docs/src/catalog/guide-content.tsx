import type { MDXComponents } from "mdx/types"
import type { ComponentProps, ReactNode } from "react"

import { tokens } from "@registry/styles/tokens.stylex"
import { isValidElement } from "react"

import { Box } from "@/components/ui/box"
import { Heading } from "@/components/ui/heading"
import { Link } from "@/components/ui/link"
import { Paragraph } from "@/components/ui/paragraph"

import { CopyableCode } from "./code-block"
import { DocumentationLayout } from "./docs-layout"
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "./docs-page"
import { guideToc, headingId } from "./guide-toc"

function GuideH2({ children, id }: ComponentProps<"h2">) {
  return (
    <Heading
      as="h2"
      id={
        id ?? (typeof children === "string" ? headingId(children) : undefined)
      }
      fontFamily={tokens["--font-heading"]}
      fontSize={"1.5rem"}
      fontWeight={650}
      letterSpacing={"-0.025em"}
      lineHeight={1.3}
      marginBlockStart={"3rem"}
      marginBlockEnd={"1rem"}
      scrollMarginBlockStart={"6rem"}
    >
      {children}
    </Heading>
  )
}

function GuideH3({ children, id }: ComponentProps<"h3">) {
  return (
    <Heading
      as="h3"
      id={
        id ?? (typeof children === "string" ? headingId(children) : undefined)
      }
      fontFamily={tokens["--font-heading"]}
      fontSize={"1.2rem"}
      fontWeight={600}
      lineHeight={1.4}
      marginBlockStart={"2rem"}
      marginBlockEnd={"0.75rem"}
      scrollMarginBlockStart={"6rem"}
    >
      {children}
    </Heading>
  )
}

function GuideCode({ children }: { children?: ReactNode }) {
  if (isValidElement<{ children?: ReactNode }>(children)) {
    const code = children.props.children
    if (typeof code === "string") return <CopyableCode code={code} />
  }
  return (
    <Box
      as="pre"
      backgroundColor={tokens["--code"]}
      color={tokens["--code-foreground"]}
      padding={"1.25rem"}
      borderRadius={tokens["--radius-lg"]}
      overflowX={"auto"}
      fontFamily={tokens["--font-mono"]}
      fontSize={"0.8125rem"}
      lineHeight={1.75}
      marginBlock={"1.5rem"}
    >
      {children}
    </Box>
  )
}

const guideComponents: MDXComponents = {
  h2: GuideH2,
  h3: GuideH3,
  p: ({ children }) => (
    <Paragraph marginBlock="1rem" lineHeight={1.8}>
      {children}
    </Paragraph>
  ),
  a: ({ children, href, title, target, rel }) => (
    <Link
      color={tokens["--foreground"]}
      textDecoration={"underline"}
      textDecorationColor={tokens["--border"]}
      textUnderlineOffset={"0.25em"}
      borderRadius={tokens["--radius-sm"]}
      _hover={{ textDecorationColor: tokens["--foreground"] }}
      _focusVisible={{
        outlineColor: tokens["--ring"],
        outlineStyle: "solid",
        outlineWidth: 2,
        outlineOffset: 4,
      }}
      href={href}
      title={title}
      target={target}
      rel={rel}
    >
      {children}
    </Link>
  ),
  ul: ({ children }) => (
    <Box
      as="ul"
      listStyleType={"disc"}
      paddingInlineStart={"1.5rem"}
      marginBlock={"1rem"}
    >
      {children}
    </Box>
  ),
  ol: ({ children }) => (
    <Box
      as="ol"
      listStyleType={"decimal"}
      paddingInlineStart={"1.5rem"}
      marginBlock={"1rem"}
    >
      {children}
    </Box>
  ),
  li: ({ children }) => (
    <Box
      as="li"
      paddingInlineStart={"0.25rem"}
      marginBlock={"0.5rem"}
      lineHeight={1.75}
    >
      {children}
    </Box>
  ),
  strong: ({ children }) => (
    <Box as="strong" fontWeight={600} color={tokens["--foreground"]}>
      {children}
    </Box>
  ),
  code: ({ children }) => (
    <Box
      as="code"
      fontFamily={tokens["--font-mono"]}
      fontSize={"0.875em"}
      backgroundColor={tokens["--code"]}
      color={tokens["--code-foreground"]}
      borderRadius={tokens["--radius-sm"]}
      paddingBlock={"0.15rem"}
      paddingInline={"0.35rem"}
      overflowWrap={"anywhere"}
    >
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
