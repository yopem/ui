"use client"

import * as React from "react"
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
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

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./pagination"
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
    manualPagination: false,
    autoResetPageIndex: false,
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
                    "space-y-1",
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
                    <div className="pt-1">
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
              <input
                type="number"
                min={1}
                max={table.getPageCount()}
                defaultValue={table.getState().pagination.pageIndex + 1}
                onChange={(e) => {
                  const page = e.target.value ? Number(e.target.value) - 1 : 0
                  table.setPageIndex(page)
                }}
                className="w-16 rounded border px-1 py-0.5 text-sm"
              />
            </span>
          </PaginationItem>
          <PaginationItem>
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              className="ml-2 rounded border px-1 py-0.5 text-sm"
            >
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  Show {pageSize}
                </option>
              ))}
            </select>
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      <div className="mt-1 text-sm">
        {table.getPrePaginationRowModel().rows.length} Rows
      </div>
    </>
  )
}

/**
 */
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

  return (
    <select
      onChange={(e) => column.setFilterValue(e.target.value)}
      value={columnFilterValue}
      className="rounded border p-1"
    >
      <option value="">All</option>
      {values.map((val) => (
        <option key={val} value={val}>
          {val}
        </option>
      ))}
    </select>
  )
}

/**
 * Props for Filter component
 */
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
              column.setFilterValue((old: [number, number]) => [value, old[1]])
            }
            placeholder="Min"
            className="w-24 rounded border shadow"
          />
          <DebouncedInput
            type="number"
            value={Array.isArray(columnFilterValue) ? columnFilterValue[1] : ""}
            onChange={(value) =>
              column.setFilterValue((old: [number, number]) => [old[0], value])
            }
            placeholder="Max"
            className="w-24 rounded border shadow"
          />
        </div>
        <div className="h-1" />
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

/**
 * Debounced input component for filters
 */
interface DebouncedInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "onChange" | "value"
  > {
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
    <input
      {...props}
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  )
}
