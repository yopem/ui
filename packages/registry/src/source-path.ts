import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const root = dirname(fileURLToPath(import.meta.url))

export function resolveSourcePath(path: string) {
  if (
    !/^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_.-]+)+$/.test(path) ||
    path.split("/").some((part) => part === "." || part === "..")
  )
    throw new Error(`Invalid source path: ${path}`)

  if (path === "components/editor/LICENSE.md")
    return resolve(root, "../../editor/LICENSE.md")

  if (path.startsWith("components/editor/"))
    return resolve(
      root,
      "../../editor/src",
      path.slice("components/editor/".length),
    )

  if (path.startsWith("lib/editor-ai/"))
    return resolve(
      root,
      "../../editor/src/server/ai",
      path.slice("lib/editor-ai/".length),
    )

  if (path === "lib/editor-auth/index.ts")
    return resolve(root, "../../editor/src/server/auth-index.ts")

  if (path === "lib/editor-collaboration/collaboration-native-model.ts")
    return resolve(root, "../../editor/src/collaboration-native-model.ts")

  if (path.startsWith("lib/editor-collaboration/"))
    return resolve(
      root,
      "../../editor/src/server",
      path === "lib/editor-collaboration/index.ts"
        ? "collaboration-index.ts"
        : path.slice("lib/editor-collaboration/".length),
    )

  if (path.startsWith("lib/editor-assets/"))
    return resolve(
      root,
      "../../editor/src/server",
      path === "lib/editor-assets/index.ts"
        ? "asset-index.ts"
        : path.slice("lib/editor-assets/".length),
    )

  if (path.startsWith("lib/editor-store/"))
    return resolve(
      root,
      "../../editor/src/server",
      path === "lib/editor-store/index.ts"
        ? "document-index.ts"
        : path.slice("lib/editor-store/".length),
    )

  if (path.startsWith("lib/editor-auth/"))
    return resolve(
      root,
      "../../editor/src/server",
      path.slice("lib/editor-auth/".length),
    )

  return resolve(root, path)
}
