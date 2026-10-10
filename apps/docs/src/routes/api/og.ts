import regularFontUrl from "@expo-google-fonts/figtree/400Regular/Figtree_400Regular.ttf?inline"
import boldFontUrl from "@expo-google-fonts/figtree/700Bold/Figtree_700Bold.ttf?inline"
import { createFileRoute } from "@tanstack/react-router"

import { renderOgImage } from "@/lib/og"

let fontsPromise: Promise<ArrayBuffer[]> | undefined

export const Route = createFileRoute("/api/og")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)

        const title = cleanText(
          url.searchParams.get("title"),
          "Yopem UI · StyleX React UI Library",
          120,
        )

        const description = cleanText(
          url.searchParams.get("description"),
          "Accessible React components you copy, own, and customize.",
          220,
        )

        const [regularFont, boldFont] = await loadFonts(request)

        const png = await renderOgImage(
          title,
          description,
          regularFont,
          boldFont,
        )

        return new Response(new Uint8Array(png), {
          headers: {
            "Cache-Control":
              "public, max-age=86400, stale-while-revalidate=604800",
            "Content-Type": "image/png",
            "X-Content-Type-Options": "nosniff",
          },
        })
      },
    },
  },
})

function cleanText(value: string | null, fallback: string, maxLength: number) {
  const text = value?.trim().slice(0, maxLength)

  return text === "" ? fallback : (text ?? fallback)
}

function loadFonts(request: Request) {
  return (fontsPromise ??= Promise.all(
    [regularFontUrl, boldFontUrl].map((fontUrl) =>
      fetch(new URL(fontUrl, request.url)).then((response) => {
        if (!response.ok) throw new Error("Could not load OG image font")

        return response.arrayBuffer()
      }),
    ),
  ))
}
