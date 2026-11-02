import { hydrateRoot } from "react-dom/client"

import { StaticPrefixView } from "./static-prefix-view"

const root = document.getElementById("fixture")

if (!root) throw new Error("Missing fixture root")

const bytes = Uint8Array.from(atob(root.dataset.source ?? ""), (character) =>
  character.charCodeAt(0),
)

const html = new TextDecoder().decode(bytes)

hydrateRoot(root, <StaticPrefixView html={html} />, {
  onRecoverableError(error) {
    document.documentElement.dataset.hydrationError = String(error)
  },
})
