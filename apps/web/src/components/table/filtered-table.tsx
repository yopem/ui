// pages/ExamplePage.tsx
"use client"

import * as React from "react"
import {
  createColumnHelperInstance,
  FilteredTable,
  type ColumnDef,
} from "@yopem-ui/react"

interface Person {
  firstName: string
  lastName: string
  age: number
  visits: number
  status: string
  progress: number
}

const columnHelper = createColumnHelperInstance<Person>()

const columns = [
  columnHelper.accessor("firstName", {
    id: "firstName",
    header: "First Name",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor((row) => row.lastName, {
    id: "lastName",
    cell: (info) => info.getValue(),
    header: () => <span>Last Name</span>,
  }),
  columnHelper.accessor((row) => `${row.firstName} ${row.lastName}`, {
    id: "fullName",
    header: "Full Name",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("age", {
    header: () => "Age",
    cell: (info) => info.getValue(),
    meta: { filterVariant: "range" },
  }),
  columnHelper.accessor("visits", {
    header: () => <span>Visits</span>,
    cell: (info) => info.getValue(),
    meta: { filterVariant: "range" },
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: (info) => info.getValue(),
    meta: { filterVariant: "select" },
  }),
  columnHelper.accessor("progress", {
    header: "Profile Progress",
    cell: (info) => info.getValue(),
    meta: { filterVariant: "range" },
  }),
] as ColumnDef<Person>[]

const data: Person[] = [
  {
    firstName: "Tanner",
    lastName: "Linsley",
    age: 24,
    visits: 100,
    status: "In Relationship",
    progress: 50,
  },
  {
    firstName: "Tandy",
    lastName: "Miller",
    age: 40,
    visits: 40,
    status: "Single",
    progress: 80,
  },
  {
    firstName: "Joe",
    lastName: "Dirte",
    age: 45,
    visits: 20,
    status: "Complicated",
    progress: 10,
  },
  {
    firstName: "Anna",
    lastName: "Smith",
    age: 29,
    visits: 70,
    status: "Single",
    progress: 65,
  },
  {
    firstName: "Chris",
    lastName: "Johnson",
    age: 35,
    visits: 55,
    status: "In Relationship",
    progress: 90,
  },
  {
    firstName: "Sara",
    lastName: "Connor",
    age: 31,
    visits: 33,
    status: "Single",
    progress: 40,
  },
  {
    firstName: "David",
    lastName: "Lee",
    age: 38,
    visits: 100,
    status: "Complicated",
    progress: 75,
  },
  {
    firstName: "Emily",
    lastName: "Clark",
    age: 27,
    visits: 60,
    status: "In Relationship",
    progress: 55,
  },
  {
    firstName: "Mike",
    lastName: "Brown",
    age: 50,
    visits: 20,
    status: "Single",
    progress: 35,
  },
  {
    firstName: "Sophia",
    lastName: "Davis",
    age: 22,
    visits: 10,
    status: "Complicated",
    progress: 20,
  },
  {
    firstName: "Daniel",
    lastName: "Wilson",
    age: 34,
    visits: 90,
    status: "In Relationship",
    progress: 85,
  },
  {
    firstName: "Lisa",
    lastName: "Taylor",
    age: 41,
    visits: 30,
    status: "Single",
    progress: 70,
  },
  {
    firstName: "Paul",
    lastName: "Anderson",
    age: 37,
    visits: 45,
    status: "Complicated",
    progress: 60,
  },
  {
    firstName: "Grace",
    lastName: "Thomas",
    age: 28,
    visits: 25,
    status: "Single",
    progress: 30,
  },
  {
    firstName: "Mark",
    lastName: "Jackson",
    age: 42,
    visits: 85,
    status: "In Relationship",
    progress: 95,
  },
  {
    firstName: "Olivia",
    lastName: "White",
    age: 26,
    visits: 15,
    status: "Complicated",
    progress: 10,
  },
  {
    firstName: "Kevin",
    lastName: "Harris",
    age: 36,
    visits: 75,
    status: "Single",
    progress: 55,
  },
  {
    firstName: "Natalie",
    lastName: "Martin",
    age: 30,
    visits: 40,
    status: "In Relationship",
    progress: 45,
  },
  {
    firstName: "Brian",
    lastName: "Garcia",
    age: 33,
    visits: 50,
    status: "Single",
    progress: 65,
  },
  {
    firstName: "Chloe",
    lastName: "Martinez",
    age: 39,
    visits: 35,
    status: "Complicated",
    progress: 25,
  },
]

export default function FilteredTableExample() {
  return (
    <div className="min-w-full">
      <FilteredTable columns={columns} data={data} />
    </div>
  )
}
