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

export default function Particle() {
  return (
    <Table {...stylex.props(demoStyles.demo1)} variant="card">
      <TableHeader>
        <TableRow>
          <TableHead>Project</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Team</TableHead>
          <TableHead {...stylex.props(demoStyles.demo2)}>Budget</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell {...stylex.props(demoStyles.demo3)}>
            Website Redesign
          </TableCell>
          <TableCell>
            <Badge variant="outline">
              <span aria-hidden="true" {...stylex.props(demoStyles.demo4)} />
              Paid
            </Badge>
          </TableCell>
          <TableCell>Frontend Team</TableCell>
          <TableCell {...stylex.props(demoStyles.demo2)}>$12,500</TableCell>
        </TableRow>
        <TableRow>
          <TableCell {...stylex.props(demoStyles.demo3)}>Mobile App</TableCell>
          <TableCell>
            <Badge variant="outline">
              <span aria-hidden="true" {...stylex.props(demoStyles.demo5)} />
              Unpaid
            </Badge>
          </TableCell>
          <TableCell>Mobile Team</TableCell>
          <TableCell {...stylex.props(demoStyles.demo2)}>$8,750</TableCell>
        </TableRow>
        <TableRow>
          <TableCell {...stylex.props(demoStyles.demo3)}>
            API Integration
          </TableCell>
          <TableCell>
            <Badge variant="outline">
              <span aria-hidden="true" {...stylex.props(demoStyles.demo6)} />
              Pending
            </Badge>
          </TableCell>
          <TableCell>Backend Team</TableCell>
          <TableCell {...stylex.props(demoStyles.demo2)}>$5,200</TableCell>
        </TableRow>
        <TableRow>
          <TableCell {...stylex.props(demoStyles.demo3)}>
            Database Migration
          </TableCell>
          <TableCell>
            <Badge variant="outline">
              <span aria-hidden="true" {...stylex.props(demoStyles.demo4)} />
              Paid
            </Badge>
          </TableCell>
          <TableCell>DevOps Team</TableCell>
          <TableCell {...stylex.props(demoStyles.demo2)}>$3,800</TableCell>
        </TableRow>
        <TableRow>
          <TableCell {...stylex.props(demoStyles.demo3)}>
            User Dashboard
          </TableCell>
          <TableCell>
            <Badge variant="outline">
              <span aria-hidden="true" {...stylex.props(demoStyles.demo4)} />
              Paid
            </Badge>
          </TableCell>
          <TableCell>UX Team</TableCell>
          <TableCell {...stylex.props(demoStyles.demo2)}>$7,200</TableCell>
        </TableRow>
        <TableRow>
          <TableCell {...stylex.props(demoStyles.demo3)}>
            Security Audit
          </TableCell>
          <TableCell>
            <Badge variant="outline">
              <span aria-hidden="true" {...stylex.props(demoStyles.demo7)} />
              Failed
            </Badge>
          </TableCell>
          <TableCell>Security Team</TableCell>
          <TableCell {...stylex.props(demoStyles.demo2)}>$2,100</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total Budget</TableCell>
          <TableCell {...stylex.props(demoStyles.demo2)}>$39,550</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
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
