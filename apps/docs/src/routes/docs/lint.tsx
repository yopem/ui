import { createFileRoute } from "@tanstack/react-router"

import { CopyableCode } from "@/catalog/code-block"
import { DocumentationLayout } from "@/catalog/docs-layout"
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "@/catalog/docs-page"
import { docsStyles } from "@/catalog/docs-styles"
import { Box } from "@/components/ui/stylex/box"
import { Heading } from "@/components/ui/stylex/heading"
import { Link } from "@/components/ui/stylex/link"
import { Paragraph } from "@/components/ui/stylex/paragraph"
import { createSeo } from "@/lib/seo"

export const Route = createFileRoute("/docs/lint")({
  head: () =>
    createSeo({
      description:
        "Configure six Yopem UI Oxlint rules for component usage, style props, and static StyleX styles.",
      path: "/docs/lint",
      title: "Lint rules · Yopem UI",
    }),
  component: LintGuide,
})

function LintGuide() {
  return (
    <DocumentationLayout>
      <DocsPage
        toc={[
          { title: "Rules", url: "#rules", depth: 2 },
          { title: "Configuration", url: "#configuration", depth: 2 },
          { title: "Exceptions", url: "#exceptions", depth: 2 },
        ]}
      >
        <DocsTitle>Lint rules</DocsTitle>
        <DocsDescription>
          Six source-owned Oxlint rules check component usage, style props, and
          static StyleX styles across the docs app.
        </DocsDescription>
        <DocsBody>
          <Paragraph xstyle={docsStyles.p}>
            First,{" "}
            <Link href="/docs/layout" xstyle={docsStyles.link}>
              choose a layout component
            </Link>
            .
          </Paragraph>
          <Heading as="h2" id="rules" xstyle={docsStyles.h2}>
            Rules
          </Heading>
          <Paragraph xstyle={docsStyles.p}>
            The @yopem-ui/oxlint-plugin workspace provides six rules. Its
            recommended configuration enables all of them:
          </Paragraph>
          <Box as="ul" xstyle={docsStyles.ul}>
            <Box as="li" xstyle={docsStyles.li}>
              <Box as="strong" xstyle={docsStyles.strong}>
                prefer-ui-primitives
              </Box>
              : prefer UI components over native HTML JSX.
            </Box>
            <Box as="li" xstyle={docsStyles.li}>
              <Box as="strong" xstyle={docsStyles.strong}>
                enforce-styling-methods
              </Box>
              : check allowed styling methods and prefer direct style props
              where possible.
            </Box>
            <Box as="li" xstyle={docsStyles.li}>
              <Box as="strong" xstyle={docsStyles.strong}>
                no-leaked-dom-style-props
              </Box>
              : reject UI-only aliases on native HTML elements.
            </Box>
            <Box as="li" xstyle={docsStyles.li}>
              <Box as="strong" xstyle={docsStyles.strong}>
                no-unsupported-style-props
              </Box>
              : replace known unsupported aliases with supported names.
            </Box>
            <Box as="li" xstyle={docsStyles.li}>
              <Box as="strong" xstyle={docsStyles.strong}>
                static-stylex
              </Box>
              : require statically analyzable StyleX declarations.
            </Box>
            <Box as="li" xstyle={docsStyles.li}>
              <Box as="strong" xstyle={docsStyles.strong}>
                valid-polymorphic-as
              </Box>
              : validate native tags on Box and heading levels on Heading.
            </Box>
          </Box>
          <Heading as="h2" id="configuration" xstyle={docsStyles.h2}>
            Configuration
          </Heading>
          <Paragraph xstyle={docsStyles.p}>
            Enable all six rules for your app source. Adjust the plugin path and
            file glob for your project.
          </Paragraph>
          <CopyableCode
            title=".oxlintrc.json"
            code={JSON.stringify(
              {
                jsPlugins: [
                  {
                    name: "yopem-ui",
                    specifier: "./packages/oxlint-plugin/src/index.ts",
                  },
                ],
                overrides: [
                  {
                    files: ["apps/docs/src/**/*.{tsx,jsx}"],
                    rules: {
                      "yopem-ui/enforce-styling-methods": "error",
                      "yopem-ui/no-leaked-dom-style-props": "error",
                      "yopem-ui/no-unsupported-style-props": "error",
                      "yopem-ui/prefer-ui-primitives": "error",
                      "yopem-ui/static-stylex": "error",
                      "yopem-ui/valid-polymorphic-as": "error",
                    },
                  },
                ],
              },
              null,
              2,
            )}
          />
          <Heading as="h2" id="exceptions" xstyle={docsStyles.h2}>
            Exceptions and fixes
          </Heading>
          <Paragraph xstyle={docsStyles.p}>
            The prefer-ui-primitives rule accepts allowElements for narrow
            native-tag exceptions. It does not autofix tag replacements because
            changing semantics or imports needs review. Other rules may offer
            safe fixes or suggestions; review them before applying. This
            repository allows document-shell and resource tags only in its root
            route. The Satori social-image renderer keeps intrinsic JSX because
            it is not a DOM renderer. Registry implementations and tests are
            outside the docs rule scope.
          </Paragraph>
          <Paragraph xstyle={docsStyles.p}>
            SVG, MathML, custom elements and component expressions remain
            supported. HTML inside SVG foreignObject is still checked. Run bun
            run lint to enforce the rule, and bun test
            packages/oxlint-plugin/test to verify its CLI behavior.
          </Paragraph>
        </DocsBody>
      </DocsPage>
    </DocumentationLayout>
  )
}
