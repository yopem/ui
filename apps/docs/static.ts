import { createRequire } from "node:module"
import { resolve } from "node:path"

import { renderOgImage } from "./src/lib/og"

const require = createRequire(import.meta.url)

const output = resolve(import.meta.dirname, ".output/public")

const [regularFont, boldFont] = await Promise.all(
  [
    "@expo-google-fonts/figtree/400Regular/Figtree_400Regular.ttf",
    "@expo-google-fonts/figtree/700Bold/Figtree_700Bold.ttf",
  ].map((font) => Bun.file(require.resolve(font)).arrayBuffer()),
)

for await (const path of new Bun.Glob("**/*.html").scan(output)) {
  const metadata = new Map<string, string>()
  await new HTMLRewriter()
    .on("meta[property]", {
      element(element) {
        const property = element.getAttribute("property")
        const content = element.getAttribute("content")

        if (property && content) metadata.set(property, content)
      },
    })
    .transform(new Response(Bun.file(resolve(output, path))))
    .arrayBuffer()

  const title = metadata.get("og:title")
  const description = metadata.get("og:description")
  const image = metadata.get("og:image")

  if (!title || !description || !image) continue

  const png = await renderOgImage(title, description, regularFont, boldFont)
  await Bun.write(resolve(output, `.${new URL(image).pathname}`), png)
}
