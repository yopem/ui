export function isSafeLink(url: string) {
  try {
    const parsed = new URL(url)

    return ["https:", "http:", "mailto:", "tel:"].includes(parsed.protocol)
  } catch {
    return false
  }
}
