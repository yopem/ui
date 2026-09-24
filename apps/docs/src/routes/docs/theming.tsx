import { createFileRoute } from "@tanstack/react-router"

import { CopyableCode } from "@/catalog/code-block"
import { getDocumentation } from "@/catalog/docs.functions"
import { GuidePage } from "@/catalog/guide-content"
import { Box } from "@/components/ui/box"
import Content from "@/content/theming.mdx"
import source from "@/content/theming.mdx?raw"
import { createSeo } from "@/lib/seo"

export const Route = createFileRoute("/docs/theming")({
  loader: () => getDocumentation({ data: "theme" }),
  head: () =>
    createSeo({
      description:
        "Customize Yopem UI tokens, individual components, and optional light and dark modes.",
      path: "/docs/theming",
      title: "Theming · Yopem UI",
    }),
  component: Theming,
})

function ThemeFiles() {
  const data = Route.useLoaderData()
  const themeFiles = data.files.filter((file) => file.path.startsWith("theme/"))

  return (
    <Box marginBlock="2rem" minInlineSize={0}>
      {themeFiles.map((file) => (
        <CopyableCode
          key={file.path}
          code={file.content}
          header={file.target}
          preview
          title={file.target}
        />
      ))}
    </Box>
  )
}

function Theming() {
  return (
    <GuidePage
      title="Theming"
      description="Most apps only need to edit the shared tokens. Use xstyle for one-off changes. Add the theme runtime only when users need to switch between light, dark, and system modes."
      source={source}
      Content={Content}
      components={{ ThemeFiles }}
    />
  )
}
