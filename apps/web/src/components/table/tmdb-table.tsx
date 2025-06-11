"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import type {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  SortingState,
} from "@tanstack/react-table"
import { ControlledTable } from "@yopem-ui/react"

export interface Movie {
  id: number
  title: string
  release_date: string
  vote_average: number
}

const movieColumns: ColumnDef<Movie, unknown>[] = [
  {
    accessorKey: "title",
    header: "Title",
    meta: { filterVariant: "text" },
  },
  {
    accessorKey: "release_date",
    header: "Release Date",
    meta: { filterVariant: "text" },
  },
  {
    accessorKey: "vote_average",
    header: "Rating",
    meta: { filterVariant: "range" },
  },
]

async function fetchMovies({
  pageIndex,
  pageSize,
  sorting,
  filters,
}: {
  pageIndex: number
  pageSize: number
  sorting?: SortingState
  filters: ColumnFiltersState
}) {
  const apiKey = "b08364c6e443363275695e6752510848"
  const page = pageIndex + 1

  const titleFilter = filters.find((f) => f.id === "title")?.value as
    | string
    | undefined
  const releaseFilter = filters.find((f) => f.id === "release_date")?.value as
    | string
    | undefined
  const ratingFilter = filters.find((f) => f.id === "vote_average")?.value as
    | [number, number]
    | undefined
  const baseUrl = titleFilter
    ? "https://api.themoviedb.org/3/search/movie"
    : "https://api.themoviedb.org/3/discover/movie"

  const params = new URLSearchParams()
  params.set("api_key", apiKey)
  params.set("page", page.toString())
  params.set("language", "en-US")
  params.set("pagesize", pageSize.toString())

  if (titleFilter?.trim()) {
    params.set("query", titleFilter.trim())
  }
  // @ts-ignore fix date filter

  if (releaseFilter) {
    params.set("primary_release_date.gte", releaseFilter)
  }

  if (ratingFilter?.[0] !== undefined) {
    params.set("vote_average.gte", String(ratingFilter[0]))
  }
  if (ratingFilter?.[1] !== undefined) {
    params.set("vote_average.lte", String(ratingFilter[1]))
  }

  const sort = sorting?.[0]
  // fix sort
  if (sort?.id) {
    const sortKey =
      sort.id === "vote_average" || sort.id === "release_date"
        ? sort.id
        : "popularity"
    params.set("sort_by", `${sortKey}.${sort.desc ? "desc" : "asc"}`)
  }

  const url = `${baseUrl}?${params.toString()}`
  const res = await fetch(url)
  const json = await res.json()
  return {
    results: json.results ?? [],
    totalPages: json.total_pages ?? 0,
  }
}

export function TMDbTable() {
  const [filters, setFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  const { data, isFetching } = useQuery({
    queryKey: ["tmdb", filters, sorting, pagination],
    queryFn: () =>
      fetchMovies({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        sorting,
        filters,
      }),
  })

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold">TMDb Movies</h2>
      <ControlledTable<Movie>
        columns={movieColumns}
        data={data?.results ?? []}
        totalPages={data?.totalPages ?? 0}
        isLoading={isFetching}
        pagination={pagination}
        sorting={sorting}
        columnFilters={filters}
        setPagination={setPagination}
        setSorting={setSorting}
        setColumnFilters={setFilters}
        pageSizeOptions={[10, 20, 30]}
        manualMode={true}
      />
    </div>
  )
}
