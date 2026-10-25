import { Text } from "@registry/components/ui/text"
import { ClientOnly } from "@tanstack/react-router"
import { createClientOnlyFn } from "@tanstack/react-start"

import { PublicNativeCollaborationExample } from "./editor-examples/public-native-collaboration"

const renderNativeCollaboration = createClientOnlyFn(
  function renderNativeCollaborationClient() {
    return <PublicNativeCollaborationExample />
  },
)

function NativeCollaborationClient() {
  return renderNativeCollaboration()
}

export function EditorNativeCollaborationClient() {
  return (
    <ClientOnly
      fallback={<Text>Native room providers load only in the browser.</Text>}
    >
      <NativeCollaborationClient />
    </ClientOnly>
  )
}
