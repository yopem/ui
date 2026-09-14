import * as stylex from "@stylexjs/stylex"

import { Badge } from "@/components/ui/stylex/badge"
import { Frame } from "@/components/ui/stylex/frame"
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

interface Project {
  budget: string
  name: string
  status: ProjectStatus
  team: string
}

const headings = ["Project", "Status", "Team", "Budget"]

const projects: Project[] = [
  {
    budget: "$12,500",
    name: "Website Redesign",
    status: "Paid",
    team: "Frontend Team",
  },
  {
    budget: "$8,750",
    name: "Mobile App",
    status: "Unpaid",
    team: "Mobile Team",
  },
  {
    budget: "$5,200",
    name: "API Integration",
    status: "Pending",
    team: "Backend Team",
  },
  {
    budget: "$3,800",
    name: "Database Migration",
    status: "Paid",
    team: "DevOps Team",
  },
  {
    budget: "$7,200",
    name: "User Dashboard",
    status: "Paid",
    team: "UX Team",
  },
  {
    budget: "$2,100",
    name: "Security Audit",
    status: "Failed",
    team: "Security Team",
  },
]

function getStatusStyle(status: ProjectStatus) {
  switch (status) {
    case "Paid":
      return demoStyles.demo4
    case "Unpaid":
      return demoStyles.demo5
    case "Pending":
      return demoStyles.demo6
    case "Failed":
      return demoStyles.demo7
  }
}

export default function Particle() {
  return (
    <Frame {...stylex.props(demoStyles.demo1)}>
      <Table variant="card">
        <TableHeader>
          <TableRow>
            {headings.map((heading) => (
              <TableHead
                {...stylex.props(heading === "Budget" && demoStyles.demo2)}
                key={heading}
              >
                {heading}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow key={project.name}>
              <TableCell {...stylex.props(demoStyles.demo3)}>
                {project.name}
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  <span
                    aria-hidden="true"
                    {...stylex.props(getStatusStyle(project.status))}
                  />
                  {project.status}
                </Badge>
              </TableCell>
              <TableCell>{project.team}</TableCell>
              <TableCell {...stylex.props(demoStyles.demo2)}>
                {project.budget}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3}>Total Budget</TableCell>
            <TableCell {...stylex.props(demoStyles.demo2)}>$39,550</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </Frame>
  )
}

const demoStyles = stylex.create({
  demo1: {
    inlineSize: "100%",
  },
  demo2: {
    textAlign: "right",
  },
  demo3: {
    fontWeight: "500",
  },
  demo4: {
    inlineSize: "calc(0.25rem * 1.5)",
    blockSize: "calc(0.25rem * 1.5)",
    borderRadius: "calc(infinity * 1px)",
    backgroundColor: "oklch(69.6% 0.17 162.48)",
  },
  demo5: {
    inlineSize: "calc(0.25rem * 1.5)",
    blockSize: "calc(0.25rem * 1.5)",
    borderRadius: "calc(infinity * 1px)",
    backgroundColor: {
      default: "var(--muted-foreground)",
      "@supports (color: color-mix(in lab, red, red))":
        "color-mix(in oklab, var(--muted-foreground) 64%, transparent)",
    },
  },
  demo6: {
    inlineSize: "calc(0.25rem * 1.5)",
    blockSize: "calc(0.25rem * 1.5)",
    borderRadius: "calc(infinity * 1px)",
    backgroundColor: "oklch(76.9% 0.188 70.08)",
  },
  demo7: {
    inlineSize: "calc(0.25rem * 1.5)",
    blockSize: "calc(0.25rem * 1.5)",
    borderRadius: "calc(infinity * 1px)",
    backgroundColor: "oklch(63.7% 0.237 25.331)",
  },
})
