import FilteredTable from "@/components/table/filtered-table"
import { TableBasic } from "@/components/table/table-basic"

export default function TablePage() {
  return (
    <div className="flex flex-col overflow-x-hidden px-4 py-12">
      <div className="mt-12 max-w-full">
        <TableBasic />
      </div>

      <div className="mt-12">
        <h2 className="mb-4 text-2xl font-bold">Tanstack Table</h2>

        <div className="">
          <FilteredTable />
        </div>
      </div>
    </div>
  )
}
