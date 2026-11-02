export function scanDocumentJSON(source: string, maxDepth: number) {
  const stack: (Set<string> | null)[] = []

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index]

    if (char === "{" || char === "[") {
      if (stack.length > maxDepth) return "depth"
      stack.push(char === "{" ? new Set<string>() : null)
    } else if (char === "}" || char === "]") stack.pop()
    else if (char === '"') {
      const start = index

      index += 1

      while (index < source.length && source[index] !== '"') {
        if (source[index] === "\\") index += 1
        index += 1
      }

      let next = index + 1

      while (
        source[next] === " " ||
        source[next] === "\t" ||
        source[next] === "\n" ||
        source[next] === "\r"
      )
        next += 1

      if (source[next] !== ":") continue
      const names = stack.at(-1)

      if (!names) throw new Error("Invalid document JSON scan state.")
      const key: string = JSON.parse(source.slice(start, index + 1))

      if (names.has(key)) return "duplicate"
      names.add(key)
    }
  }
}
