import { Text } from "@registry/components/ui/text"
import { ClientOnly } from "@tanstack/react-router"
import { createClientOnlyFn } from "@tanstack/react-start"

import { PublicPlaygroundExample } from "./editor-examples/public-playground"

const renderPlayground = createClientOnlyFn(function renderPlaygroundClient() {
  return <PublicPlaygroundExample />
})

function PlaygroundClient() {
  return renderPlayground()
}

export function EditorPlaygroundClient() {
  return (
    <ClientOnly
      fallback={<Text>Playground tools load only in the browser.</Text>}
    >
      <PlaygroundClient />
    </ClientOnly>
  )
}
