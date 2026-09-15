import * as stylex from "@stylexjs/stylex"

import { Badge } from "@/components/ui/stylex/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/stylex/table"

type ProjectStatus = "Paid" | "Unpaid" | "Pending" | "Failed"
type ProjectRow = [string, ProjectStatus, string, string]

const projectRows: ProjectRow[] = [
  ["Website Redesign", "Paid", "Frontend Team", "$12,500"],
  ["Mobile App", "Unpaid", "Mobile Team", "$8,750"],
  ["API Integration", "Pending", "Backend Team", "$5,200"],
  ["Database Migration", "Paid", "DevOps Team", "$3,800"],
  ["User Dashboard", "Paid", "UX Team", "$7,200"],
  ["Security Audit", "Failed", "Security Team", "$2,100"],
]

function getStatusStyle(status: ProjectStatus) {
  switch (status) {
    case "Paid":
      return exampleStyles.example4
    case "Unpaid":
      return exampleStyles.example5
    case "Pending":
      return exampleStyles.example6
    case "Failed":
      return exampleStyles.example7
  }
}

export default function Example() {
  return (
    <Table {...stylex.props(exampleStyles.example1)} variant="card">
      <TableHeader>
        <TableRow>
          <TableHead>Project</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Team</TableHead>
          <TableHead {...stylex.props(exampleStyles.example2)}>
            Budget
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projectRows.map(([project, status, team, budget]) => (
          <TableRow key={project}>
            <TableCell {...stylex.props(exampleStyles.example3)}>
              {project}
            </TableCell>
            <TableCell>
              <Badge variant="outline">
                <span
                  aria-hidden="true"
                  {...stylex.props(getStatusStyle(status))}
                />
                {status}
              </Badge>
            </TableCell>
            <TableCell>{team}</TableCell>
            <TableCell {...stylex.props(exampleStyles.example2)}>
              {budget}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total Budget</TableCell>
          <TableCell {...stylex.props(exampleStyles.example2)}>
            $39,550
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}

const exampleStyles = stylex.create({
  example1: {
    inlineSize: "100%",
  },
  example2: {
    textAlign: "right",
  },
  example3: {
    fontWeight: "500",
  },
  example4: {
    inlineSize: "calc(0.25rem * 1.5)",
    blockSize: "calc(0.25rem * 1.5)",
    borderRadius: "calc(infinity * 1px)",
    backgroundColor: "oklch(69.6% 0.17 162.48)",
  },
  example5: {
    inlineSize: "calc(0.25rem * 1.5)",
    blockSize: "calc(0.25rem * 1.5)",
    borderRadius: "calc(infinity * 1px)",
    backgroundColor: {
      default: "var(--muted-foreground)",
      "@supports (color: color-mix(in lab, red, red))":
        "color-mix(in oklab, var(--muted-foreground) 64%, transparent)",
    },
  },
  example6: {
    inlineSize: "calc(0.25rem * 1.5)",
    blockSize: "calc(0.25rem * 1.5)",
    borderRadius: "calc(infinity * 1px)",
    backgroundColor: "oklch(76.9% 0.188 70.08)",
  },
  example7: {
    inlineSize: "calc(0.25rem * 1.5)",
    blockSize: "calc(0.25rem * 1.5)",
    borderRadius: "calc(infinity * 1px)",
    backgroundColor: "oklch(63.7% 0.237 25.331)",
  },
})
