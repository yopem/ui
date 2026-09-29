export function guideToc(source: string) {
  const items: { title: string; url: string; depth: number }[] = []
  let fence = false

  for (const line of source.split("\n")) {
    if (/^(```|~~~)/.test(line)) {
      fence = !fence
      continue
    }

    if (fence) continue
    const match = /^(#{2,3}) (.+)$/.exec(line)

    if (match) {
      const [, level, title] = match
      items.push({ title, url: `#${headingId(title)}`, depth: level.length })
    }
  }

  return items
}

export function headingId(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
}
