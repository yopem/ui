import type { MDXComponents } from "mdx/types"
import type { ComponentProps, ReactNode } from "react"

import { isValidElement } from "react"

import { Box } from "@/components/ui/box"
import { Heading } from "@/components/ui/heading"
import { Link } from "@/components/ui/link"
import { Paragraph } from "@/components/ui/paragraph"

import { CopyableCode } from "./code-block"
import { DocumentationLayout } from "./docs-layout"
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "./docs-page"
import { docsStyles } from "./docs-styles"
import { guideToc, headingId } from "./guide-toc"

function GuideH2({ children, ...props }: ComponentProps<"h2">) {
  return (
    <Heading
      as="h2"
      id={typeof children === "string" ? headingId(children) : undefined}
      xstyle={docsStyles.h2}
      {...props}
    >
      {children}
    </Heading>
  )
}

function GuideH3({ children, ...props }: ComponentProps<"h3">) {
  return (
    <Heading
      as="h3"
      id={typeof children === "string" ? headingId(children) : undefined}
      xstyle={docsStyles.h3}
      {...props}
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
    <Box as="pre" xstyle={docsStyles.pre}>
      {children}
    </Box>
  )
}

const guideComponents: MDXComponents = {
  h2: GuideH2,
  h3: GuideH3,
  p: (props) => <Paragraph xstyle={docsStyles.p} {...props} />,
  a: (props) => <Link xstyle={docsStyles.link} {...props} />,
  ul: (props) => <Box as="ul" xstyle={docsStyles.ul} {...props} />,
  ol: (props) => <Box as="ol" xstyle={docsStyles.ol} {...props} />,
  li: (props) => <Box as="li" xstyle={docsStyles.li} {...props} />,
  strong: (props) => <Box as="strong" xstyle={docsStyles.strong} {...props} />,
  code: (props) => <Box as="code" xstyle={docsStyles.inlineCode} {...props} />,
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
