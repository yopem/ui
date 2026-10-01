import { createHash } from "node:crypto"
import { lstatSync, readFileSync, readdirSync, readlinkSync } from "node:fs"
import { join } from "node:path"

export function snapshot(root: string) {
  return ["", ...readdirSync(root, { recursive: true, encoding: "utf8" })]
    .sort()
    .map((path) => {
      const fullPath = join(root, path)
      const entry = lstatSync(fullPath)

      return {
        path,
        mode: entry.mode,
        content: entry.isSymbolicLink()
          ? readlinkSync(fullPath)
          : entry.isFile()
            ? createHash("sha256").update(readFileSync(fullPath)).digest("hex")
            : null,
      }
    })
}
