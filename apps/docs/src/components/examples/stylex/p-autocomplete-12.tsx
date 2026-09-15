"use client"

import type { ReactNode } from "react"

import * as stylex from "@stylexjs/stylex"
import { useEffect, useRef, useState } from "react"

import {
  Autocomplete,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
  AutocompletePopup,
  AutocompleteStatus,
  useAutocompleteFilter,
} from "@/components/ui/stylex/autocomplete"
import { Spinner } from "@/components/ui/stylex/spinner"

interface Movie {
  id: string
  title: string
  year: number
}
const top100Movies: Movie[] = [
  { id: "1", title: "The Shawshank Redemption", year: 1994 },
  { id: "2", title: "The Godfather", year: 1972 },
  { id: "3", title: "The Dark Knight", year: 2008 },
  { id: "4", title: "The Godfather Part II", year: 1974 },
  { id: "5", title: "12 Angry Men", year: 1957 },
  { id: "8", title: "Pulp Fiction", year: 1994 },
  { id: "11", title: "Forrest Gump", year: 1994 },
  { id: "14", title: "Inception", year: 2010 },
]

async function searchMovies(
  query: string,
  filter: (item: string, query: string) => boolean,
): Promise<Movie[]> {
  await new Promise((resolve) => setTimeout(resolve, Math.random() * 500 + 100))
  if (Math.random() < 0.01 || query === "will_error") {
    throw new Error("Network error")
  }
  return top100Movies.filter(
    (movie) =>
      filter(movie.title, query) || filter(movie.year.toString(), query),
  )
}

export default function Example() {
  const [searchValue, setSearchValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<Movie[]>([])
  const [error, setError] = useState<string | null>(null)

  const { contains } = useAutocompleteFilter({ sensitivity: "base" })
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ignoreRef = useRef(false)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      ignoreRef.current = true
    }
  }, [])

  const handleValueChange = (value: string) => {
    setSearchValue(value)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    ignoreRef.current = false
    if (!value) {
      setSearchResults([])
      setIsLoading(false)
      setError(null)
      return
    }
    setIsLoading(true)
    setError(null)
    timeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchMovies(value, contains)
        if (!ignoreRef.current) setSearchResults(results)
      } catch {
        if (!ignoreRef.current) {
          setError("Failed to fetch movies. Please try again.")
          setSearchResults([])
        }
      } finally {
        if (!ignoreRef.current) setIsLoading(false)
      }
    }, 300)
  }

  let status: ReactNode = `${searchResults.length} result${searchResults.length === 1 ? "" : "s"} found`
  if (isLoading) {
    status = (
      <span {...stylex.props(exampleStyles.example1)}>
        Searching...
        <Spinner {...stylex.props(exampleStyles.example2)} />
      </span>
    )
  } else if (error) {
    status = <span {...stylex.props(exampleStyles.example3)}>{error}</span>
  } else if (searchResults.length === 0 && searchValue) {
    status = (
      <span {...stylex.props(exampleStyles.example4)}>
        Movie or year "{searchValue}" does not exist in the Top 100 IMDb movies
      </span>
    )
  }

  const shouldRenderPopup = searchValue !== ""

  return (
    <Autocomplete
      filter={null}
      items={searchResults}
      itemToStringValue={(item: unknown) => (item as Movie).title}
      onValueChange={handleValueChange}
      value={searchValue}
    >
      <AutocompleteInput placeholder="e.g. Pulp Fiction or 1994" />
      {shouldRenderPopup && (
        <AutocompletePopup aria-busy={isLoading || undefined}>
          <AutocompleteStatus {...stylex.props(exampleStyles.example5)}>
            {status}
          </AutocompleteStatus>
          <AutocompleteList>
            {(movie: Movie) => (
              <AutocompleteItem key={movie.id} value={movie}>
                <div {...stylex.props(exampleStyles.example6)}>
                  <div {...stylex.props(exampleStyles.example7)}>
                    {movie.title}
                  </div>
                  <div {...stylex.props(exampleStyles.example8)}>
                    {movie.year}
                  </div>
                </div>
              </AutocompleteItem>
            )}
          </AutocompleteList>
        </AutocompletePopup>
      )}
    </Autocomplete>
  )
}

const exampleStyles = stylex.create({
  example1: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "calc(0.25rem * 2)",
    color: "var(--muted-foreground)",
  },
  example2: {
    inlineSize: {
      default: "calc(0.25rem * 4.5)",
      "@media (min-width: 40rem)": "calc(0.25rem * 4)",
    },
    blockSize: {
      default: "calc(0.25rem * 4.5)",
      "@media (min-width: 40rem)": "calc(0.25rem * 4)",
    },
  },
  example3: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    fontWeight: "400",
    color: "var(--destructive)",
  },
  example4: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    fontWeight: "400",
    color: "var(--muted-foreground)",
  },
  example5: {
    color: "var(--muted-foreground)",
  },
  example6: {
    display: "flex",
    inlineSize: "100%",
    flexDirection: "column",
    gap: "0.25rem",
  },
  example7: {
    fontWeight: "500",
  },
  example8: {
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: "var(--muted-foreground)",
  },
})
