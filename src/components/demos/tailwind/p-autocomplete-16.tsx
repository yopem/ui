"use client"

import type { ReactNode } from "react"

import { MapPinIcon } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import {
  Autocomplete,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
  AutocompletePopup,
  AutocompleteStatus,
} from "@/components/ui/tailwind/autocomplete"
import { Spinner } from "@/components/ui/tailwind/spinner"

// Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY with the Places API (New) enabled to fetch
// live suggestions. Without a key, the demo falls back to sample addresses.
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""

interface AddressSuggestion {
  placeId: string
  text: string
  mainText: string
  secondaryText: string
}

const sampleAddresses: AddressSuggestion[] = [
  {
    mainText: "1600 Amphitheatre Parkway",
    secondaryText: "Mountain View, CA 94043, USA",
  },
  {
    mainText: "1600 Pennsylvania Avenue NW",
    secondaryText: "Washington, DC 20500, USA",
  },
  { mainText: "350 Fifth Avenue", secondaryText: "New York, NY 10118, USA" },
  {
    mainText: "221B Baker Street",
    secondaryText: "London NW1 6XE, United Kingdom",
  },
  {
    mainText: "Champ de Mars, 5 Avenue Anatole France",
    secondaryText: "75007 Paris, France",
  },
  {
    mainText: "Piazza del Colosseo, 1",
    secondaryText: "00184 Roma RM, Italy",
  },
  { mainText: "Platz der Republik 1", secondaryText: "11011 Berlin, Germany" },
  {
    mainText: "1 Macquarie Street",
    secondaryText: "Sydney NSW 2000, Australia",
  },
].map((address, index) => ({
  ...address,
  placeId: `sample-${index + 1}`,
  text: `${address.mainText}, ${address.secondaryText}`,
}))

// A short-lived session token groups Autocomplete + Place Details requests
// for billing.
function newSessionToken() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2)
}

interface PlacesAutocompleteResponse {
  suggestions?: {
    placePrediction?: {
      placeId?: string
      text?: { text?: string }
      structuredFormat?: {
        mainText?: { text?: string }
        secondaryText?: { text?: string }
      }
    }
  }[]
}

async function fetchAddressSuggestions(
  query: string,
  sessionToken: string,
  signal: AbortSignal,
): Promise<AddressSuggestion[]> {
  const response = await fetch(
    "https://places.googleapis.com/v1/places:autocomplete",
    {
      body: JSON.stringify({ input: query, sessionToken }),
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
      },
      method: "POST",
      signal,
    },
  )
  if (!response.ok) {
    throw new Error("Places API request failed")
  }
  const data = (await response.json()) as PlacesAutocompleteResponse
  const suggestions: AddressSuggestion[] = []
  for (const suggestion of data.suggestions ?? []) {
    const prediction = suggestion.placePrediction
    if (!prediction?.placeId) continue
    const text = prediction.text?.text ?? ""
    suggestions.push({
      mainText: prediction.structuredFormat?.mainText?.text ?? text,
      placeId: prediction.placeId,
      secondaryText: prediction.structuredFormat?.secondaryText?.text ?? "",
      text,
    })
  }
  return suggestions
}

async function searchSampleAddresses(
  query: string,
): Promise<AddressSuggestion[]> {
  await new Promise((resolve) => setTimeout(resolve, Math.random() * 500 + 100))
  const lowerQuery = query.toLowerCase()
  return sampleAddresses.filter((address) =>
    address.text.toLowerCase().includes(lowerQuery),
  )
}

export default function Particle() {
  const [searchValue, setSearchValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [error, setError] = useState<string | null>(null)
  const sessionTokenRef = useRef<string | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ignoreRef = useRef(false)
  const controllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      controllerRef.current?.abort()
      ignoreRef.current = true
    }
  }, [])

  const handleValueChangeWithSearch = (
    value: string,
    eventDetails: { reason: string },
  ) => {
    setSearchValue(value)
    if (eventDetails.reason === "item-press") {
      sessionTokenRef.current = null
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    controllerRef.current?.abort()
    ignoreRef.current = false
    const query = value.trim()
    if (!query) {
      setSuggestions([])
      setIsLoading(false)
      setError(null)
      return
    }
    setIsLoading(true)
    setError(null)
    const controller = new AbortController()
    controllerRef.current = controller
    timeoutRef.current = setTimeout(async () => {
      try {
        sessionTokenRef.current ??= newSessionToken()
        const results = GOOGLE_MAPS_API_KEY
          ? await fetchAddressSuggestions(
              query,
              sessionTokenRef.current,
              controller.signal,
            )
          : await searchSampleAddresses(query)
        if (!ignoreRef.current) setSuggestions(results)
      } catch {
        if (!ignoreRef.current && !controller.signal.aborted) {
          setError("Could not load address suggestions. Please try again.")
          setSuggestions([])
        }
      } finally {
        if (!ignoreRef.current) setIsLoading(false)
      }
    }, 300)
  }

  let status: ReactNode = `${suggestions.length} suggestion${suggestions.length === 1 ? "" : "s"} found`
  if (isLoading) {
    status = (
      <span className="text-muted-foreground flex items-center justify-between gap-2">
        Searching addresses...
        <Spinner className="size-4.5 sm:size-4" />
      </span>
    )
  } else if (error) {
    status = (
      <span className="text-destructive text-sm font-normal">{error}</span>
    )
  } else if (suggestions.length === 0 && searchValue) {
    status = (
      <span className="text-muted-foreground text-sm font-normal">
        No addresses found for "{searchValue}"
      </span>
    )
  }

  const shouldRenderPopup = searchValue.trim() !== ""

  return (
    <Autocomplete
      autoHighlight
      filter={null}
      items={suggestions}
      itemToStringValue={(item: unknown) => (item as AddressSuggestion).text}
      onValueChange={handleValueChangeWithSearch}
      value={searchValue}
    >
      <AutocompleteInput
        aria-label="Address"
        autoComplete="off"
        className="min-w-0 *:[input]:truncate"
        placeholder="Enter an address"
        startAddon={<MapPinIcon />}
      />
      {shouldRenderPopup && (
        <AutocompletePopup
          aria-busy={isLoading || undefined}
          className="max-w-(--anchor-width) *:min-w-0"
        >
          <AutocompleteStatus className="text-muted-foreground">
            {status}
          </AutocompleteStatus>
          <AutocompleteList>
            {(suggestion: AddressSuggestion) => (
              <AutocompleteItem key={suggestion.placeId} value={suggestion}>
                <span className="flex w-full min-w-0 flex-col">
                  <span className="truncate font-medium">
                    {suggestion.mainText}
                  </span>
                  <span className="text-muted-foreground truncate text-xs">
                    {suggestion.secondaryText}
                  </span>
                </span>
              </AutocompleteItem>
            )}
          </AutocompleteList>
        </AutocompletePopup>
      )}
    </Autocomplete>
  )
}
