import * as stylex from "@stylexjs/stylex"

import { Badge } from "@/components/ui/stylex/badge"
import { Box } from "@/components/ui/stylex/box"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/stylex/table"
export default function Example() {
  return (
    <Table>
      <TableCaption>A list of current projects.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Project</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Team</TableHead>
          <TableHead {...stylex.props(exampleStyles.example1)}>
            Budget
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell {...stylex.props(exampleStyles.example2)}>
            Website Redesign
          </TableCell>
          <TableCell>
            <Badge variant="outline">
              <Box
                as="span"
                aria-hidden="true"
                {...stylex.props(exampleStyles.example3)}
              />
              Paid
            </Badge>
          </TableCell>
          <TableCell>Frontend Team</TableCell>
          <TableCell {...stylex.props(exampleStyles.example1)}>
            $12,500
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell {...stylex.props(exampleStyles.example2)}>
            Mobile App
          </TableCell>
          <TableCell>
            <Badge variant="outline">
              <Box
                as="span"
                aria-hidden="true"
                {...stylex.props(exampleStyles.example4)}
              />
              Unpaid
            </Badge>
          </TableCell>
          <TableCell>Mobile Team</TableCell>
          <TableCell {...stylex.props(exampleStyles.example1)}>
            $8,750
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell {...stylex.props(exampleStyles.example2)}>
            API Integration
          </TableCell>
          <TableCell>
            <Badge variant="outline">
              <Box
                as="span"
                aria-hidden="true"
                {...stylex.props(exampleStyles.example5)}
              />
              Pending
            </Badge>
          </TableCell>
          <TableCell>Backend Team</TableCell>
          <TableCell {...stylex.props(exampleStyles.example1)}>
            $5,200
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell {...stylex.props(exampleStyles.example2)}>
            Database Migration
          </TableCell>
          <TableCell>
            <Badge variant="outline">
              <Box
                as="span"
                aria-hidden="true"
                {...stylex.props(exampleStyles.example3)}
              />
              Paid
            </Badge>
          </TableCell>
          <TableCell>DevOps Team</TableCell>
          <TableCell {...stylex.props(exampleStyles.example1)}>
            $3,800
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell {...stylex.props(exampleStyles.example2)}>
            User Dashboard
          </TableCell>
          <TableCell>
            <Badge variant="outline">
              <Box
                as="span"
                aria-hidden="true"
                {...stylex.props(exampleStyles.example3)}
              />
              Paid
            </Badge>
          </TableCell>
          <TableCell>UX Team</TableCell>
          <TableCell {...stylex.props(exampleStyles.example1)}>
            $7,200
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell {...stylex.props(exampleStyles.example2)}>
            Security Audit
          </TableCell>
          <TableCell>
            <Badge variant="outline">
              <Box
                as="span"
                aria-hidden="true"
                {...stylex.props(exampleStyles.example6)}
              />
              Failed
            </Badge>
          </TableCell>
          <TableCell>Security Team</TableCell>
          <TableCell {...stylex.props(exampleStyles.example1)}>
            $2,100
          </TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total Budget</TableCell>
          <TableCell {...stylex.props(exampleStyles.example1)}>
            $39,550
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}

const exampleStyles = stylex.create({
  example1: {
    textAlign: "right",
  },
  example2: {
    fontWeight: "500",
  },
  example3: {
    inlineSize: "calc(0.25rem * 1.5)",
    blockSize: "calc(0.25rem * 1.5)",
    borderRadius: "calc(infinity * 1px)",
    backgroundColor: "oklch(69.6% 0.17 162.48)",
  },
  example4: {
    inlineSize: "calc(0.25rem * 1.5)",
    blockSize: "calc(0.25rem * 1.5)",
    borderRadius: "calc(infinity * 1px)",
    backgroundColor: {
      default: "var(--muted-foreground)",
      "@supports (color: color-mix(in lab, red, red))":
        "color-mix(in oklab, var(--muted-foreground) 64%, transparent)",
    },
  },
  example5: {
    inlineSize: "calc(0.25rem * 1.5)",
    blockSize: "calc(0.25rem * 1.5)",
    borderRadius: "calc(infinity * 1px)",
    backgroundColor: "oklch(76.9% 0.188 70.08)",
  },
  example6: {
    inlineSize: "calc(0.25rem * 1.5)",
    blockSize: "calc(0.25rem * 1.5)",
    borderRadius: "calc(infinity * 1px)",
    backgroundColor: "oklch(63.7% 0.237 25.331)",
  },
})
