import { createFileRoute } from "@tanstack/react-router"

import { CopyableCode } from "@/catalog/code-block"
import { getDocumentation } from "@/catalog/docs.functions"
import { GuidePage } from "@/catalog/guide-content"
import { Box } from "@/components/ui/box"
import { Paragraph } from "@/components/ui/paragraph"
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs"
import Content from "@/content/installation.mdx"
import source from "@/content/installation.mdx?raw"
import { createSeo } from "@/lib/seo"

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
        <Paragraph marginBlock="1rem" lineHeight={1.8}>
          Run from your project root. Init detects Vite React, client TanStack
          Router, TanStack Start, Next.js App Router, or Astro; installs base
          files and dependencies; then configures build plugins, aliases, and
          root styles. Existing project code stays in place. Unsupported or
          conflicting configuration stops with an error instead of being
          overwritten. The CLI package is not published yet; bunx commands work
          after its release.
        </Paragraph>
        <CopyableCode
          code="bunx @yopem-ui/cli init"
          header="Terminal"
          title="Initialize project with CLI"
        />
        <Paragraph marginBlock="1rem" lineHeight={1.8}>
          For ambiguous projects, pass --framework vite, tanstack-router,
          tanstack-start, next, or astro. Next.js requires Node 24+ and webpack;
          React Router framework/RSC mode and Next.js Pages Router need manual
          setup. To refresh installed files later, run bunx @yopem-ui/cli update
          base. Local edits are preserved unless you pass --force.
        </Paragraph>
      </TabsPanel>
      <TabsPanel value="manual">
        <Paragraph marginBlock="1rem" lineHeight={1.8}>
          Copy these files once. Keep their displayed paths. Component pages
          include them in required files, so later components need no second
          copy.
        </Paragraph>
        <Box marginBlock="2rem" minInlineSize={0}>
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
