import { createFileRoute } from "@tanstack/react-router"

import { CopyableCode } from "@/catalog/code-block"
import { GuidePage } from "@/catalog/guide-content"
import Content from "@/content/installation.mdx"
import source from "@/content/installation.mdx?raw"
import { createSeo } from "@/lib/seo"

export const Route = createFileRoute("/docs/installation")({
  head: () =>
    createSeo({
      description:
        "Install Yopem UI with StyleX in Next.js, TanStack Router, TanStack Start, React Router, or Astro.",
      path: "/docs/installation",
      title: "Installation · Yopem UI",
    }),
  component: Installation,
})

function InstallationCommands() {
  return (
    <>
      <CopyableCode
        language="shellscript"
        code="bunx @yopem-ui/cli init"
        title="Initialize project with CLI"
      />
      <CopyableCode
        language="shellscript"
        code="bunx @yopem-ui/cli init --framework react-router"
        title="Select framework with CLI"
      />
    </>
  )
}

function Installation() {
  return (
    <GuidePage
      title="Installation"
      description="Initialize supported frameworks with one CLI command."
      source={source}
      Content={Content}
      components={{ InstallationCommands }}
    />
  )
}
