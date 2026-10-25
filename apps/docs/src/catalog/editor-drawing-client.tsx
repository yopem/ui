import { Text } from "@registry/components/ui/text"
import { ClientOnly } from "@tanstack/react-router"
import { createClientOnlyFn } from "@tanstack/react-start"

import { PublicDrawingExample } from "./editor-examples/public-drawing"

const renderDrawing = createClientOnlyFn(function renderDrawingClient() {
  return <PublicDrawingExample />
})

function DrawingClient() {
  return renderDrawing()
}

export function EditorDrawingClient() {
  return (
    <ClientOnly fallback={<Text>Drawing tools load only in the browser.</Text>}>
      <DrawingClient />
    </ClientOnly>
  )
}
