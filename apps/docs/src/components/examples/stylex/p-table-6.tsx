"use client"

import * as stylex from "@stylexjs/stylex"
import { useMemo, useState } from "react"

import { Badge } from "@/components/ui/stylex/badge"
import { Box } from "@/components/ui/stylex/box"
import { CardFrame } from "@/components/ui/stylex/card"
import { Checkbox } from "@/components/ui/stylex/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/stylex/table"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@/lib/table-wrapper"
interface Project {
  id: string
  project: string
  status: "Paid" | "Unpaid" | "Pending" | "Failed"
  team: string
  budget: number
}

const data: Project[] = [
  {
    budget: 12500,
    id: "1",
    project: "Website Redesign",
    status: "Paid",
    team: "Frontend Team",
  },
  {
    budget: 8750,
    id: "2",
    project: "Mobile App",
    status: "Unpaid",
    team: "Mobile Team",
  },
  {
    budget: 5200,
    id: "3",
    project: "API Integration",
    status: "Pending",
    team: "Backend Team",
  },
  {
    budget: 3800,
    id: "4",
    project: "Database Migration",
    status: "Paid",
    team: "DevOps Team",
  },
  {
    budget: 7200,
    id: "5",
    project: "User Dashboard",
    status: "Paid",
    team: "UX Team",
  },
  {
    budget: 2100,
    id: "6",
    project: "Security Audit",
    status: "Failed",
    team: "Security Team",
  },
]

const getStatusStyle = (status: Project["status"]) => {
  switch (status) {
    case "Paid":
      return exampleStyles.paid
    case "Pending":
      return exampleStyles.pending
    case "Failed":
      return exampleStyles.failed
    default:
      return exampleStyles.unpaid
  }
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
  style: "currency",
})

const getColumns = (): ColumnDef<Project>[] => [
  {
    cell: ({ row }) => (
      <Checkbox
        aria-label="Select row"
        checked={row.getIsSelected()}
        disabled={!row.getCanSelect()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
    ),
    enableSorting: false,
    header: ({ table }) => {
      const isAllSelected = table.getIsAllPageRowsSelected()
      const isSomeSelected = table.getIsSomePageRowsSelected()
      return (
        <Checkbox
          aria-label="Select all"
          checked={isAllSelected}
          indeterminate={isSomeSelected && !isAllSelected}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      )
    },
    id: "select",
  },
  {
    accessorKey: "project",
    cell: ({ row }) => (
      <Box {...stylex.props(exampleStyles.example1)}>
        {row.original.project}
      </Box>
    ),
    header: "Project",
  },
  {
    accessorKey: "status",
    cell: ({ row }) => {
      const status = row.original.status
      return (
        <Badge variant="outline">
          <Box
            as="span"
            aria-hidden="true"
            {...stylex.props(exampleStyles.statusDot, getStatusStyle(status))}
          />
          {status}
        </Badge>
      )
    },
    header: "Status",
  },
  {
    accessorKey: "team",
    header: "Team",
  },
  {
    accessorKey: "budget",
    cell: ({ row }) => {
      const amount = Number.parseFloat(row.getValue("budget"))
      const formatted = currencyFormatter.format(amount)
      return <Box {...stylex.props(exampleStyles.example2)}>{formatted}</Box>
    },
    header: () => <Box {...stylex.props(exampleStyles.example2)}>Budget</Box>,
  },
]

type ProjectTableModel = ReturnType<typeof useReactTable<Project>>

function ProjectTableBody({
  columnCount,
  table,
}: {
  columnCount: number
  table: ProjectTableModel
}) {
  return (
    <TableBody>
      {table.getRowModel().rows.length ? (
        table.getRowModel().rows.map((row) => (
          <TableRow data-state={row.getIsSelected() && "selected"} key={row.id}>
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
            {...stylex.props(exampleStyles.example4)}
            colSpan={columnCount}
          >
            No results.
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  )
}

export default function Example() {
  const [tableData] = useState<Project[]>(data)
  const [rowSelection, setRowSelection] = useState({})

  const columns = useMemo(() => getColumns(), [])

  const table = useReactTable({
    columns,
    data: tableData,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
    },
  })

  const totalBudget = tableData.reduce(
    (sum, project) => sum + project.budget,
    0,
  )
  const formattedTotal = currencyFormatter.format(totalBudget)

  return (
    <CardFrame {...stylex.props(exampleStyles.example3)}>
      <Table variant="card">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <ProjectTableBody columnCount={columns.length} table={table} />
        <TableFooter>
          <TableRow>
            <TableCell colSpan={4}>Total Budget</TableCell>
            <TableCell {...stylex.props(exampleStyles.example2)}>
              {formattedTotal}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </CardFrame>
  )
}

const exampleStyles = stylex.create({
  example1: {
    fontWeight: "500",
  },
  example2: {
    textAlign: "right",
  },
  example3: {
    inlineSize: "100%",
  },
  example4: {
    blockSize: "calc(0.25rem * 24)",
    textAlign: "center",
  },
  statusDot: {
    blockSize: "0.375rem",
    borderRadius: "9999px",
    inlineSize: "0.375rem",
  },
  paid: { backgroundColor: "oklch(69.6% 0.17 162.48)" },
  unpaid: {
    backgroundColor:
      "color-mix(in oklab, var(--muted-foreground) 64%, transparent)",
  },
  pending: { backgroundColor: "oklch(76.9% 0.188 70.08)" },
  failed: { backgroundColor: "oklch(63.7% 0.237 25.331)" },
})
