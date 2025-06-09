"use client"

import * as React from "react"
import { createListCollection, type ListCollection } from "@ark-ui/react"
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
  type FilterFn,
  type RowData,
} from "@tanstack/react-table"
import { Icon } from "@yopem-ui/react-icons"
import { cn } from "@yopem-ui/utils"

import { Input } from "./input"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValueText,
} from "./select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table"

export type { ColumnDef, FilterFn, RowData } from "@tanstack/react-table"

export const createColumnHelperInstance = <TData extends RowData>() =>
  createColumnHelper<TData>()

export interface FilteredTableProps<TData extends RowData> {
  columns: ColumnDef<TData, unknown>[]
  data: TData[]
  filterFns?: Record<string, FilterFn<TData>>
}

export function FilteredTable<TData extends RowData>({
  columns,
  data,
  filterFns = {},
}: FilteredTableProps<TData>) {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  )
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const table = useReactTable<TData>({
    data,
    columns,
    filterFns,
    state: {
      columnFilters,
      pagination,
    },
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    manualPagination: false,
    autoResetPageIndex: false,
  })

  const pageSizeCollection: ListCollection = createListCollection({
    items: ["10", "20", "30", "40", "50"],
  })

  return (
    <>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  colSpan={header.colSpan}
                  className={cn(
                    "space-y-1 py-2",
                    header.column.getCanSort() && "cursor-pointer select-none",
                  )}
                >
                  {header.isPlaceholder ? null : (
                    <div
                      onClick={header.column.getToggleSortingHandler()}
                      className="flex items-center gap-1"
                    >
                      <span>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                      </span>
                      {{
                        asc: (
                          <Icon
                            className="text-muted-foreground size-4"
                            name="ArrowUp"
                          />
                        ),
                        desc: (
                          <Icon
                            className="text-muted-foreground size-4"
                            name="ArrowDown"
                          />
                        ),
                      }[header.column.getIsSorted() as string] ?? null}
                    </div>
                  )}

                  {header.column.getCanFilter() && (
                    <div>
                      <Filter<TData> column={header.column} />
                    </div>
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationLink
              onClick={() => table.setPageIndex(0)}
              aria-disabled={!table.getCanPreviousPage()}
              className={cn(
                !table.getCanPreviousPage() && "pointer-events-none opacity-50",
              )}
            >
              <Icon name="ChevronsLeft" />
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => table.previousPage()}
              aria-disabled={!table.getCanPreviousPage()}
              className={cn(
                !table.getCanPreviousPage() && "pointer-events-none opacity-50",
              )}
            />
          </PaginationItem>

          <PaginationItem>
            <span className="px-2 text-sm">
              Page{" "}
              <strong>
                {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount()}
              </strong>
            </span>
          </PaginationItem>

          <PaginationItem>
            <PaginationNext
              onClick={() => table.nextPage()}
              aria-disabled={!table.getCanNextPage()}
              className={cn(
                !table.getCanNextPage() && "pointer-events-none opacity-50",
              )}
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              aria-disabled={!table.getCanNextPage()}
              className={cn(
                !table.getCanNextPage() && "pointer-events-none opacity-50",
              )}
            >
              <Icon name="ChevronsRight" />
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <span className="ml-2 flex items-center gap-1 text-sm">
              | Go to page:
              <Input
                aria-label="Page number"
                type="number"
                min={1}
                max={table.getPageCount()}
                defaultValue={table.getState().pagination.pageIndex + 1}
                onChange={(e) => {
                  const page = e.target.value ? Number(e.target.value) - 1 : 0
                  table.setPageIndex(page)
                }}
                className="h-8 w-16 rounded border px-1 py-0.5 text-sm"
              />
            </span>
          </PaginationItem>
          <PaginationItem>
            <Select
              value={[String(table.getState().pagination.pageSize)]}
              collection={pageSizeCollection}
              onValueChange={(e) => {
                table.setPageSize(Number(e.value[0]))
              }}
            >
              <SelectTrigger className="ml-2 !h-8 w-[120px] px-2 py-1 text-sm">
                <SelectValueText placeholder="Page size" />
              </SelectTrigger>
              <SelectContent>
                {pageSizeCollection.items.map((item) => (
                  <SelectItem key={item} item={item}>
                    Show {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      <div className="mt-1 text-sm">
        {table.getPrePaginationRowModel().rows.length} Rows
      </div>
    </>
  )
}

interface SelectFilterProps<TData extends RowData> {
  column: Column<TData, unknown>
  options?: string[]
}

function SelectFilter<TData extends RowData>({
  column,
  options,
}: SelectFilterProps<TData>) {
  const rawValue = column.getFilterValue()
  const columnFilterValue =
    typeof rawValue === "string" || typeof rawValue === "number"
      ? String(rawValue)
      : ""

  const values = React.useMemo<string[]>(() => {
    if (options) return options

    const unique = new Set<string>()
    column.getFacetedRowModel().rows.forEach((row) => {
      const value = row.getValue(column.id)
      if (
        value != null &&
        (typeof value === "string" || typeof value === "number")
      ) {
        unique.add(String(value))
      }
    })

    return Array.from(unique)
  }, [column, options])

  const rangeCollection: ListCollection = createListCollection({
    items: ["", ...values],
  })

  return (
    <Select
      value={[columnFilterValue]}
      collection={rangeCollection}
      onValueChange={(e) => {
        column.setFilterValue(e.value[0])
      }}
    >
      <SelectTrigger className="!h-8 w-32 p-2">
        <SelectValueText placeholder="All" />
      </SelectTrigger>
      <SelectContent>
        {rangeCollection.items.map((item) => (
          <SelectItem key={item} item={item}>
            {item === "" ? "All" : item}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

interface FilterProps<TData extends RowData> {
  column: Column<TData, unknown>
}

function Filter<TData extends RowData>({ column }: FilterProps<TData>) {
  const columnFilterValue = column.getFilterValue()
  // @ts-ignore fix dynamic meta type
  const filterVariant = column.columnDef.meta?.filterVariant as
    | "range"
    | "select"
    | undefined

  if (filterVariant === "range") {
    return (
      <div>
        <div className="flex space-x-2">
          <DebouncedInput
            type="number"
            value={Array.isArray(columnFilterValue) ? columnFilterValue[0] : ""}
            onChange={(value) =>
              column.setFilterValue((old?: [number, number]) => [
                value,
                Number(old?.[1]) ? old?.[1] : undefined,
              ])
            }
            placeholder="Min"
            className="w-24 rounded border shadow"
          />
          <DebouncedInput
            type="number"
            value={Array.isArray(columnFilterValue) ? columnFilterValue[1] : ""}
            onChange={(value) =>
              column.setFilterValue((old?: [number, number]) => [
                Number(old?.[0]) ? old?.[0] : undefined,
                value,
              ])
            }
            placeholder="Max"
            className="w-24 rounded border shadow"
          />
        </div>
      </div>
    )
  } else if (filterVariant === "select") {
    return <SelectFilter<TData> column={column} />
  }
  let displayValue = ""

  if (
    typeof columnFilterValue === "string" ||
    typeof columnFilterValue === "number"
  ) {
    displayValue = String(columnFilterValue)
  } else if (Array.isArray(columnFilterValue)) {
    displayValue = columnFilterValue.map(String).join(", ")
  } else {
    displayValue = ""
  }
  return (
    <DebouncedInput
      className="w-36 rounded border shadow"
      onChange={(value) => column.setFilterValue(value)}
      placeholder="Search..."
      type="text"
      value={displayValue}
    />
  )
}

interface DebouncedInputProps
  extends Omit<React.ComponentProps<"input">, "onChange" | "value"> {
  value: string | number
  onChange: (value: string | number) => void
  debounce?: number
}
function DebouncedInput({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}: DebouncedInputProps) {
  const [value, setValue] = React.useState<string | number>(initialValue)

  React.useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value)
    }, debounce)
    return () => clearTimeout(timeout)
  }, [value, onChange, debounce])

  return (
    <Input
      {...props}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      className="h-8 min-w-16 p-2"
    />
  )
}
