import { createFileRoute } from "@tanstack/react-router"

import { GuidePage } from "@/catalog/guide-content"
import EditorAuthContent from "@/content/editor-auth.mdx"
import editorAuthSource from "@/content/editor-auth.mdx?raw"
import { createSeo } from "@/lib/seo"

export const Route = createFileRoute("/docs/editor-auth")({
  head: () =>
    createSeo({
      description:
        "Connect editor services to OpenAuth and Better Auth. Keep document authorization separate from identity.",
      path: "/docs/editor-auth",
      title: "Editor authentication · Yopem UI",
    }),
  component: EditorAuthGuide,
})

function EditorAuthGuide() {
  return (
    <GuidePage
      title="Editor authentication"
      description="Use existing OpenAuth or Better Auth services. Check document access through your backend policy."
      source={editorAuthSource}
      Content={EditorAuthContent}
    />
  )
}
