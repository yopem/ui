import { Box } from "@registry/components/ui/box"
import { Paragraph } from "@registry/components/ui/paragraph"
import {
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
} from "@registry/components/ui/tabs"
import * as stylex from "@stylexjs/stylex"
import { createFileRoute } from "@tanstack/react-router"

import { CopyableCode } from "@/catalog/code-block"
import { getDocumentation } from "@/catalog/docs.functions"
import { GuidePage } from "@/catalog/guide-content"
import Content from "@/content/installation.mdx"
import source from "@/content/installation.mdx?raw"
import { createSeo } from "@/lib/seo"
const styles = stylex.create({
  paragraph: { marginBlock: "1rem", lineHeight: 1.8 },
  paragraph2: { marginBlock: "1rem", lineHeight: 1.8 },
  paragraph3: { marginBlock: "1rem", lineHeight: 1.8 },
  box: { marginBlock: "2rem", minInlineSize: "calc(var(--spacing) * 0)" },
})

export const Route = createFileRoute("/docs/installation")({
  loader: () => getDocumentation({ data: "base" }),
  head: () =>
    createSeo({
      description:
        "Install Yopem UI with StyleX in Next.js, TanStack Router, TanStack Start, React Router, or Astro.",
      path: "/docs/installation",
      title: "Installation · Yopem UI",
    }),
  component: Installation,
})

function InstallationMethods() {
  const data = Route.useLoaderData()

  return (
    <Tabs defaultValue="cli">
      <TabsList aria-label="Installation method">
        <TabsTab value="cli">CLI</TabsTab>
        <TabsTab value="manual">Manual</TabsTab>
      </TabsList>
      <TabsPanel value="cli">
        <Paragraph xstyle={styles.paragraph}>
          Run from your project root. Init detects Vite React, React Router
          (client or framework), TanStack Router, TanStack Start, Next.js App
          Router, or Astro; installs base files and dependencies; then
          configures build plugins, aliases, and root styles. Existing project
          code stays in place. Unsupported or conflicting configuration stops
          with an error instead of being overwritten. The CLI package is not
          published yet; bunx commands work after its release.
        </Paragraph>
        <CopyableCode
          code="bunx @yopem-ui/cli init"
          header="Terminal"
          title="Initialize project with CLI"
        />
        <Paragraph xstyle={styles.paragraph2}>
          For mixed-framework projects, pass --framework with vite,
          react-router, tanstack-router, tanstack-start, next, or astro. React
          Router client mode detects react-router or react-router-dom; framework
          mode detects @react-router/dev.
        </Paragraph>
        <CopyableCode
          code="bunx @yopem-ui/cli init --framework react-router"
          header="Terminal"
          title="Select framework with CLI"
        />
        <Paragraph xstyle={styles.paragraph2}>
          Vite integrations use Rolldown Babel; Next.js requires Node 24+ and
          webpack. React Router RSC mode and Next.js Pages Router need manual
          setup. To refresh installed files later, run bunx @yopem-ui/cli update
          base. Local edits are preserved unless you pass --force.
        </Paragraph>
      </TabsPanel>
      <TabsPanel value="manual">
        <Paragraph xstyle={styles.paragraph3}>
          Follow steps 1 and 2 above for packages and imports, then step 4 below
          for framework build configuration and root styles. Copy these files
          once at their displayed paths; later components need no second copy.
        </Paragraph>
        <Box xstyle={styles.box}>
          {data.files.map((file) => (
            <CopyableCode
              key={file.path}
              code={file.content}
              header={file.target}
              preview
              title={file.target}
            />
          ))}
        </Box>
      </TabsPanel>
    </Tabs>
  )
}

function Installation() {
  return (
    <GuidePage
      title="Installation"
      description="Initialize supported frameworks with one CLI command, or follow the manual setup steps."
      source={source}
      Content={Content}
      components={{ InstallationMethods }}
    />
  )
}
