export interface EditorSearchTextNode {
  readonly key: string
  readonly text: string
}

export interface EditorSearchMatch {
  readonly key: string
  readonly start: number
  readonly end: number
}

export interface EditorSearchResult {
  readonly matches: readonly EditorSearchMatch[]
  readonly hasMore: boolean
}

export const EDITOR_SEARCH_QUERY_LIMIT = 64

export const EDITOR_SEARCH_RESULT_LIMIT = 200

export function normalizeEditorSearchQuery(query: string) {
  let normalized = ""
  let count = 0

  for (const character of query) {
    if (count === EDITOR_SEARCH_QUERY_LIMIT) break
    normalized += character
    count += 1
  }

  return normalized
}

function foldText(text: string) {
  const folded = text.toLowerCase()
  const starts: number[] = []
  const ends: number[] = []
  let offset = 0

  for (const character of text) {
    const end = offset + character.length

    for (let index = 0; index < character.toLowerCase().length; index += 1) {
      starts.push(offset)
      ends.push(end)
    }

    offset = end
  }

  return { folded, starts, ends }
}

export function findEditorSearchMatches(
  nodes: readonly EditorSearchTextNode[],
  query: string,
): EditorSearchResult {
  const foldedQuery = normalizeEditorSearchQuery(query).toLowerCase()

  if (!foldedQuery) return { matches: [], hasMore: false }

  const matches: EditorSearchMatch[] = []

  for (const node of nodes) {
    const { folded, starts, ends } = foldText(node.text)
    let offset = 0

    while (offset <= folded.length - foldedQuery.length) {
      const startIndex = folded.indexOf(foldedQuery, offset)

      if (startIndex < 0) break

      if (matches.length === EDITOR_SEARCH_RESULT_LIMIT)
        return { matches, hasMore: true }

      const start = starts[startIndex]
      const end = ends[startIndex + foldedQuery.length - 1]

      if (start !== undefined && end !== undefined)
        matches.push({ key: node.key, start, end })

      offset = startIndex + 1
    }
  }

  return { matches, hasMore: false }
}
