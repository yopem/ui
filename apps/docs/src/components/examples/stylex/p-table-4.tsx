"use client"

import * as stylex from "@stylexjs/stylex"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  PlaneTakeoffIcon,
} from "lucide-react"
import { useState } from "react"

import { Badge } from "@/components/ui/stylex/badge"
import { Button } from "@/components/ui/stylex/button"
import { Checkbox } from "@/components/ui/stylex/checkbox"
import { Frame, FrameFooter } from "@/components/ui/stylex/frame"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/stylex/pagination"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/stylex/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/stylex/table"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
} from "@/lib/table-wrapper"

interface Flight {
  id: string
  flightCode: string
  destination: string
  departureTime: string
  arrivalTime: string
  terminal: string
  duration: string
  status: "On Time" | "Delayed" | "Cancelled" | "Boarding"
  gate: string
}

const getStatusStyle = (status: Flight["status"]) => {
  switch (status) {
    case "On Time":
      return exampleStyles.onTime
    case "Delayed":
      return exampleStyles.delayed
    case "Cancelled":
      return exampleStyles.cancelledDot
    case "Boarding":
      return exampleStyles.boarding
    default:
      return exampleStyles.unknown
  }
}

const columns: ColumnDef<Flight>[] = [
  {
    cell: ({ row }) => (
      <Checkbox
        aria-label="Select row"
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
    ),
    enableSorting: false,
    header: ({ table }) => {
      const isAllSelected = table.getIsAllPageRowsSelected()
      const isSomeSelected = table.getIsSomePageRowsSelected()
      return (
        <Checkbox
          aria-label="Select all rows"
          checked={isAllSelected}
          indeterminate={isSomeSelected && !isAllSelected}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      )
    },
    id: "select",
    size: 28,
  },
  {
    accessorKey: "flightCode",
    cell: ({ row }) => (
      <div {...stylex.props(exampleStyles.example1)}>
        {row.getValue("flightCode")}
      </div>
    ),
    header: "Flight",
    size: 80,
  },
  {
    accessorKey: "departureTime",
    cell: ({ row }) => {
      const isCancelled = row.original.status === "Cancelled"
      const isDelayed = row.original.status === "Delayed"
      return (
        <div
          {...stylex.props(
            exampleStyles.time,
            isCancelled && exampleStyles.cancelledTime,
          )}
        >
          <div {...stylex.props(isDelayed && exampleStyles.delayedTime)}>
            {row.original.departureTime}
          </div>
          <div aria-hidden="true" {...stylex.props(exampleStyles.example2)} />
          <div
            {...stylex.props(
              exampleStyles.duration,
              isCancelled && exampleStyles.struck,
            )}
          >
            {row.original.duration}
          </div>
          <div aria-hidden="true" {...stylex.props(exampleStyles.example3)} />
          <div>{row.original.arrivalTime}</div>
        </div>
      )
    },
    header: "Time",
    size: 220,
  },
  {
    accessorKey: "destination",
    cell: ({ row }) => (
      <div {...stylex.props(exampleStyles.example4)}>
        {row.getValue("destination")}
      </div>
    ),
    header: "Destination",
    size: 180,
  },
  {
    accessorKey: "status",
    cell: ({ row }) => {
      const status = row.original.status
      return (
        <Badge variant="outline">
          <span
            aria-hidden="true"
            {...stylex.props(exampleStyles.statusDot, getStatusStyle(status))}
          />
          {status}
        </Badge>
      )
    },
    header: "Status",
    size: 120,
  },
  {
    accessorKey: "terminal",
    cell: ({ row }) => (
      <Badge
        {...stylex.props(exampleStyles.example5)}
        size="lg"
        variant="outline"
      >
        <PlaneTakeoffIcon {...stylex.props(exampleStyles.icon)} />
        <span>{row.getValue("terminal")}</span>
      </Badge>
    ),
    header: "Terminal",
    size: 90,
  },
  {
    accessorKey: "gate",
    header: "Gate",
    size: 80,
  },
]

type FlightTableModel = ReturnType<typeof useReactTable<Flight>>
type FlightHeader = ReturnType<FlightTableModel["getFlatHeaders"]>[number]

function FlightTableHead({ header }: { header: FlightHeader }) {
  const columnSize = header.column.getSize()
  const sortDirection = header.column.getIsSorted()

  return (
    <TableHead
      {...(columnSize
        ? stylex.props(exampleStyles.columnWidth(`${columnSize}px`))
        : {})}
    >
      {header.isPlaceholder ? null : header.column.getCanSort() ? (
        <button
          {...stylex.props(exampleStyles.example9)}
          onClick={header.column.getToggleSortingHandler()}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault()
              header.column.getToggleSortingHandler()?.(event)
            }
          }}
          type="button"
        >
          {flexRender(header.column.columnDef.header, header.getContext())}
          {sortDirection === "asc" ? (
            <ChevronUpIcon
              aria-hidden="true"
              {...stylex.props(exampleStyles.example10)}
            />
          ) : sortDirection === "desc" ? (
            <ChevronDownIcon
              aria-hidden="true"
              {...stylex.props(exampleStyles.example10)}
            />
          ) : null}
        </button>
      ) : (
        flexRender(header.column.columnDef.header, header.getContext())
      )}
    </TableHead>
  )
}

function PageRangeSelect({ table }: { table: FlightTableModel }) {
  return (
    <Select
      items={Array.from({ length: table.getPageCount() }, (_, pageIndex) => {
        const start = pageIndex * table.getState().pagination.pageSize + 1
        const end = Math.min(
          (pageIndex + 1) * table.getState().pagination.pageSize,
          table.getRowCount(),
        )
        return { label: `${start}-${end}`, value: pageIndex + 1 }
      })}
      onValueChange={(value) => {
        if (typeof value === "number") {
          table.setPageIndex(value - 1)
        }
      }}
      value={table.getState().pagination.pageIndex + 1}
    >
      <SelectTrigger
        aria-label="Select result range"
        {...stylex.props(exampleStyles.report1, exampleStyles.report1Manual)}
        size="sm"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectPopup>
        {table.getPageOptions().map((pageIndex) => {
          const start = pageIndex * table.getState().pagination.pageSize + 1
          const end = Math.min(
            (pageIndex + 1) * table.getState().pagination.pageSize,
            table.getRowCount(),
          )
          const pageNumber = pageIndex + 1
          return (
            <SelectItem key={pageIndex} value={pageNumber}>
              {`${start}-${end}`}
            </SelectItem>
          )
        })}
      </SelectPopup>
    </Select>
  )
}

function PreviousPageButton({ table }: { table: FlightTableModel }) {
  return (
    <PaginationItem>
      <Button
        disabled={!table.getCanPreviousPage()}
        onClick={() => table.previousPage()}
        size="sm"
        variant="outline"
      >
        <ChevronLeftIcon
          aria-hidden="true"
          {...stylex.props(exampleStyles.icon2, exampleStyles.report2)}
        />
        Previous
      </Button>
    </PaginationItem>
  )
}

function NextPageButton({ table }: { table: FlightTableModel }) {
  return (
    <PaginationItem>
      <Button
        disabled={!table.getCanNextPage()}
        onClick={() => table.nextPage()}
        size="sm"
        variant="outline"
      >
        Next
        <ChevronRightIcon
          aria-hidden="true"
          {...stylex.props(exampleStyles.icon2, exampleStyles.report2)}
        />
      </Button>
    </PaginationItem>
  )
}

export default function Example() {
  const pageSize = 10

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: pageSize,
  })

  const [sorting, setSorting] = useState<SortingState>([
    {
      desc: false,
      id: "departureTime",
    },
  ])

  const table = useReactTable({
    columns,
    data: flights,
    enableSortingRemoval: false,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    state: {
      pagination,
      sorting,
    },
  })

  return (
    <Frame {...stylex.props(exampleStyles.example6)}>
      <Table variant="card" {...stylex.props(exampleStyles.example7)}>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow
              {...stylex.props(exampleStyles.example8)}
              key={headerGroup.id}
            >
              {headerGroup.headers.map((header) => (
                <FlightTableHead header={header} key={header.id} />
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                data-state={row.getIsSelected() ? "selected" : undefined}
                key={row.id}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                {...stylex.props(exampleStyles.example11)}
                colSpan={columns.length}
              >
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <FrameFooter {...stylex.props(exampleStyles.example12)}>
        <div {...stylex.props(exampleStyles.example13)}>
          {/* Results range selector */}
          <div {...stylex.props(exampleStyles.example14)}>
            <p {...stylex.props(exampleStyles.example15)}>Viewing</p>
            <PageRangeSelect table={table} />
            <p {...stylex.props(exampleStyles.example15)}>
              of{" "}
              <strong {...stylex.props(exampleStyles.example16)}>
                {table.getRowCount()}
              </strong>{" "}
              results
            </p>
          </div>

          {/* Pagination */}
          <Pagination {...stylex.props(exampleStyles.example17)}>
            <PaginationContent>
              <PreviousPageButton table={table} />
              <NextPageButton table={table} />
            </PaginationContent>
          </Pagination>
        </div>
      </FrameFooter>
    </Frame>
  )
}

const flights: Flight[] = [
  {
    arrivalTime: "11:45",
    departureTime: "08:30",
    destination: "Los Angeles",
    duration: "5h 15m",
    flightCode: "AA1234",
    gate: "A12",
    id: "1",
    status: "On Time",
    terminal: "1",
  },
  {
    arrivalTime: "17:10",
    departureTime: "14:20",
    destination: "San Francisco",
    duration: "4h 50m",
    flightCode: "DL5678",
    gate: "B24",
    id: "2",
    status: "Delayed",
    terminal: "2",
  },
  {
    arrivalTime: "13:30",
    departureTime: "10:15",
    destination: "Miami",
    duration: "3h 15m",
    flightCode: "UA9012",
    gate: "C8",
    id: "3",
    status: "On Time",
    terminal: "1",
  },
  {
    arrivalTime: "18:20",
    departureTime: "16:45",
    destination: "Seattle",
    duration: "2h 35m",
    flightCode: "SW3456",
    gate: "D15",
    id: "4",
    status: "On Time",
    terminal: "3",
  },
  {
    arrivalTime: "12:30",
    departureTime: "09:00",
    destination: "Salt Lake City",
    duration: "5h 30m",
    flightCode: "JB7890",
    gate: "E3",
    id: "5",
    status: "Cancelled",
    terminal: "2",
  },
  {
    arrivalTime: "14:15",
    departureTime: "11:30",
    destination: "Phoenix",
    duration: "2h 45m",
    flightCode: "AS2345",
    gate: "F7",
    id: "6",
    status: "On Time",
    terminal: "1",
  },
  {
    arrivalTime: "20:30",
    departureTime: "13:00",
    destination: "Las Vegas",
    duration: "5h 30m",
    flightCode: "HA6789",
    gate: "G12",
    id: "7",
    status: "Delayed",
    terminal: "2",
  },
  {
    arrivalTime: "09:00",
    departureTime: "07:15",
    destination: "Dallas",
    duration: "1h 45m",
    flightCode: "FX0123",
    gate: "H5",
    id: "8",
    status: "Boarding",
    terminal: "1",
  },
  {
    arrivalTime: "08:30",
    departureTime: "06:00",
    destination: "Denver",
    duration: "2h 30m",
    flightCode: "WN4567",
    gate: "I9",
    id: "9",
    status: "Boarding",
    terminal: "2",
  },
  {
    arrivalTime: "15:20",
    departureTime: "12:45",
    destination: "Portland",
    duration: "2h 35m",
    flightCode: "B61234",
    gate: "J14",
    id: "10",
    status: "On Time",
    terminal: "3",
  },
  {
    arrivalTime: "18:45",
    departureTime: "15:30",
    destination: "Atlanta",
    duration: "3h 15m",
    flightCode: "NK8901",
    gate: "K6",
    id: "11",
    status: "On Time",
    terminal: "1",
  },
  {
    arrivalTime: "12:00",
    departureTime: "09:45",
    destination: "Chicago",
    duration: "2h 15m",
    flightCode: "F92345",
    gate: "L11",
    id: "12",
    status: "Delayed",
    terminal: "2",
  },
  {
    arrivalTime: "14:15",
    departureTime: "11:00",
    destination: "Boston",
    duration: "3h 15m",
    flightCode: "SY6789",
    gate: "M3",
    id: "13",
    status: "On Time",
    terminal: "1",
  },
  {
    arrivalTime: "16:45",
    departureTime: "13:30",
    destination: "New York",
    duration: "3h 15m",
    flightCode: "G40123",
    gate: "N8",
    id: "14",
    status: "On Time",
    terminal: "3",
  },
  {
    arrivalTime: "11:20",
    departureTime: "08:00",
    destination: "Washington",
    duration: "3h 20m",
    flightCode: "YX5678",
    gate: "O12",
    id: "15",
    status: "Delayed",
    terminal: "2",
  },
  {
    arrivalTime: "13:50",
    departureTime: "10:30",
    destination: "Orlando",
    duration: "3h 20m",
    flightCode: "4U9012",
    gate: "P5",
    id: "16",
    status: "Delayed",
    terminal: "1",
  },
  {
    arrivalTime: "16:30",
    departureTime: "14:00",
    destination: "Houston",
    duration: "2h 30m",
    flightCode: "QF3456",
    gate: "Q9",
    id: "17",
    status: "On Time",
    terminal: "3",
  },
  {
    arrivalTime: "10:00",
    departureTime: "07:30",
    destination: "Minneapolis",
    duration: "2h 30m",
    flightCode: "LH7890",
    gate: "R7",
    id: "18",
    status: "Cancelled",
    terminal: "2",
  },
  {
    arrivalTime: "19:30",
    departureTime: "16:15",
    destination: "Detroit",
    duration: "3h 15m",
    flightCode: "KL2345",
    gate: "S4",
    id: "19",
    status: "Cancelled",
    terminal: "1",
  },
  {
    arrivalTime: "15:10",
    departureTime: "12:00",
    destination: "Philadelphia",
    duration: "3h 10m",
    flightCode: "AF6789",
    gate: "T16",
    id: "20",
    status: "On Time",
    terminal: "3",
  },
  {
    arrivalTime: "12:25",
    departureTime: "09:15",
    destination: "Charlotte",
    duration: "3h 10m",
    flightCode: "BA0123",
    gate: "U10",
    id: "21",
    status: "On Time",
    terminal: "2",
  },
  {
    arrivalTime: "18:00",
    departureTime: "15:45",
    destination: "Nashville",
    duration: "2h 15m",
    flightCode: "IB4567",
    gate: "V8",
    id: "22",
    status: "Delayed",
    terminal: "1",
  },
  {
    arrivalTime: "14:00",
    departureTime: "11:45",
    destination: "Austin",
    duration: "2h 15m",
    flightCode: "EK8901",
    gate: "W13",
    id: "23",
    status: "Cancelled",
    terminal: "3",
  },
  {
    arrivalTime: "16:40",
    departureTime: "13:15",
    destination: "Tampa",
    duration: "3h 25m",
    flightCode: "QR2345",
    gate: "X6",
    id: "24",
    status: "On Time",
    terminal: "2",
  },
  {
    arrivalTime: "11:30",
    departureTime: "08:45",
    destination: "Raleigh",
    duration: "2h 45m",
    flightCode: "TK6789",
    gate: "Y11",
    id: "25",
    status: "On Time",
    terminal: "1",
  },
  {
    arrivalTime: "12:45",
    departureTime: "10:00",
    destination: "Indianapolis",
    duration: "2h 45m",
    flightCode: "VS3456",
    gate: "Z4",
    id: "26",
    status: "On Time",
    terminal: "2",
  },
  {
    arrivalTime: "20:00",
    departureTime: "17:30",
    destination: "Kansas City",
    duration: "2h 30m",
    flightCode: "LX7890",
    gate: "A8",
    id: "27",
    status: "Delayed",
    terminal: "3",
  },
  {
    arrivalTime: "15:20",
    departureTime: "12:30",
    destination: "Columbus",
    duration: "2h 50m",
    flightCode: "OS1234",
    gate: "B19",
    id: "28",
    status: "On Time",
    terminal: "1",
  },
  {
    arrivalTime: "20:15",
    departureTime: "18:00",
    destination: "Milwaukee",
    duration: "2h 15m",
    flightCode: "SN5678",
    gate: "C22",
    id: "29",
    status: "On Time",
    terminal: "2",
  },
  {
    arrivalTime: "21:30",
    departureTime: "19:15",
    destination: "Memphis",
    duration: "2h 15m",
    flightCode: "TP9012",
    gate: "D6",
    id: "30",
    status: "On Time",
    terminal: "3",
  },
]

const exampleStyles = stylex.create({
  icon: {
    blockSize: { default: "0.875rem", "@media (min-width: 640px)": "0.75rem" },
    inlineSize: { default: "0.875rem", "@media (min-width: 640px)": "0.75rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
  },
  icon2: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
    marginInline: "-0.125rem",
  },
  columnWidth: (inlineSize: string) => ({ inlineSize }),
  example1: {
    fontFamily: '"Geist Mono", ui-monospace, monospace',
    fontWeight: "500",
    color: "var(--muted-foreground)",
  },
  example2: {
    display: "flex",
    alignItems: "center",
    gap: "calc(0.25rem * 0.5)",
    opacity: "50%",
    "::before": {
      content: '""',
      inlineSize: "calc(0.25rem * 1.5)",
      blockSize: "calc(0.25rem * 1.5)",
      borderRadius: "calc(infinity * 1px)",
      borderStyle: "solid",
      borderWidth: "1px",
      borderColor: "var(--muted-foreground)",
    },
    "::after": {
      content: '""',
      blockSize: "1px",
      inlineSize: "calc(0.25rem * 3)",
      borderBlockStartStyle: "solid",
      borderBlockStartWidth: "1px",
      borderStyle: "dashed",
      borderColor: "var(--muted-foreground)",
    },
  },
  example3: {
    display: "flex",
    alignItems: "center",
    gap: "calc(0.25rem * 0.5)",
    opacity: "50%",
    "::before": {
      content: '""',
      order: "1",
      inlineSize: "calc(0.25rem * 1.5)",
      blockSize: "calc(0.25rem * 1.5)",
      borderRadius: "calc(infinity * 1px)",
      borderStyle: "solid",
      borderWidth: "1px",
      borderColor: "var(--muted-foreground)",
    },
    "::after": {
      content: '""',
      blockSize: "1px",
      inlineSize: "calc(0.25rem * 3)",
      borderBlockStartStyle: "solid",
      borderBlockStartWidth: "1px",
      borderStyle: "dashed",
      borderColor: "var(--muted-foreground)",
    },
  },
  example4: {
    fontWeight: "500",
  },
  example5: {
    fontWeight: "400",
    fontVariantNumeric: "   tabular-nums ",
  },
  example6: {
    inlineSize: "100%",
  },
  example7: {
    tableLayout: "fixed",
  },
  example8: {
    backgroundColor: {
      default: null,
      ":hover": "transparent",
    },
  },
  example9: {
    display: "flex",
    blockSize: "100%",
    cursor: "pointer",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "calc(0.25rem * 2)",
    WebkitUserSelect: "none",
    userSelect: "none",
  },
  example10: {
    inlineSize: "calc(0.25rem * 4)",
    blockSize: "calc(0.25rem * 4)",
    flexShrink: "0",
    opacity: "80%",
  },
  example11: {
    blockSize: "calc(0.25rem * 24)",
    textAlign: "center",
  },
  example12: {
    padding: "calc(0.25rem * 2)",
  },
  example13: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "calc(0.25rem * 2)",
  },
  example14: {
    display: "flex",
    alignItems: "center",
    gap: "calc(0.25rem * 2)",
    whiteSpace: "nowrap",
  },
  example15: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    color: "var(--muted-foreground)",
  },
  example16: {
    fontWeight: "500",
    color: "var(--foreground)",
  },
  example17: {
    justifyContent: "flex-end",
  },
  time: {
    alignItems: "center",
    display: "flex",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 400,
    gap: "0.375rem",
  },
  cancelledTime: {
    color: "var(--muted-foreground)",
    textDecorationLine: "line-through",
  },
  delayedTime: { color: "var(--warning-foreground)" },
  duration: { color: "var(--muted-foreground)" },
  struck: { textDecorationLine: "line-through" },
  statusDot: {
    blockSize: "0.375rem",
    borderRadius: "9999px",
    inlineSize: "0.375rem",
  },
  onTime: { backgroundColor: "oklch(69.6% 0.17 162.48)" },
  delayed: { backgroundColor: "oklch(76.9% 0.188 70.08)" },
  cancelledDot: { backgroundColor: "oklch(63.7% 0.237 25.331)" },
  boarding: { backgroundColor: "oklch(62.3% 0.214 259.815)" },
  unknown: {
    backgroundColor:
      "color-mix(in oklab, var(--muted-foreground) 64%, transparent)",
  },
  report1: {
    inlineSize: "fit-content",
  },
  report2: {
    "@media (min-width: 640px)": { display: "none" },
  },
  report1Manual: {
    minInlineSize: 0,
  },
})
