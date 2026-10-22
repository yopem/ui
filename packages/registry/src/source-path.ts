import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const root = dirname(fileURLToPath(import.meta.url))

export function resolveSourcePath(path: string) {
  if (
    !/^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_.-]+)+$/.test(path) ||
    path.split("/").some((part) => part === "." || part === "..")
  )
    throw new Error(`Invalid source path: ${path}`)

  if (path.startsWith("components/editor/"))
    return resolve(
      root,
      "../../editor/src",
      path.slice("components/editor/".length),
    )

  if (path.startsWith("lib/editor-auth/"))
    return resolve(
      root,
      "../../editor/src/server",
      path.slice("lib/editor-auth/".length),
    )

  return resolve(root, path)
}
