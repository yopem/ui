import * as stylex from "@stylexjs/stylex"

import { Badge } from "@/components/ui/badge"
import { Box } from "@/components/ui/box"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
export function Preview() {
  return (
    <Table>
      <TableCaption>A list of current projects.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Project</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Team</TableHead>
          <TableHead {...stylex.props(previewStyles.preview1)}>
            Budget
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell {...stylex.props(previewStyles.preview2)}>
            Website Redesign
          </TableCell>
          <TableCell>
            <Badge variant="outline">
              <Box
                as="span"
                aria-hidden="true"
                {...stylex.props(previewStyles.preview3)}
              />
              Paid
            </Badge>
          </TableCell>
          <TableCell>Frontend Team</TableCell>
          <TableCell {...stylex.props(previewStyles.preview1)}>
            $12,500
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell {...stylex.props(previewStyles.preview2)}>
            Mobile App
          </TableCell>
          <TableCell>
            <Badge variant="outline">
              <Box
                as="span"
                aria-hidden="true"
                {...stylex.props(previewStyles.preview4)}
              />
              Unpaid
            </Badge>
          </TableCell>
          <TableCell>Mobile Team</TableCell>
          <TableCell {...stylex.props(previewStyles.preview1)}>
            $8,750
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell {...stylex.props(previewStyles.preview2)}>
            API Integration
          </TableCell>
          <TableCell>
            <Badge variant="outline">
              <Box
                as="span"
                aria-hidden="true"
                {...stylex.props(previewStyles.preview5)}
              />
              Pending
            </Badge>
          </TableCell>
          <TableCell>Backend Team</TableCell>
          <TableCell {...stylex.props(previewStyles.preview1)}>
            $5,200
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell {...stylex.props(previewStyles.preview2)}>
            Database Migration
          </TableCell>
          <TableCell>
            <Badge variant="outline">
              <Box
                as="span"
                aria-hidden="true"
                {...stylex.props(previewStyles.preview3)}
              />
              Paid
            </Badge>
          </TableCell>
          <TableCell>DevOps Team</TableCell>
          <TableCell {...stylex.props(previewStyles.preview1)}>
            $3,800
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell {...stylex.props(previewStyles.preview2)}>
            User Dashboard
          </TableCell>
          <TableCell>
            <Badge variant="outline">
              <Box
                as="span"
                aria-hidden="true"
                {...stylex.props(previewStyles.preview3)}
              />
              Paid
            </Badge>
          </TableCell>
          <TableCell>UX Team</TableCell>
          <TableCell {...stylex.props(previewStyles.preview1)}>
            $7,200
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell {...stylex.props(previewStyles.preview2)}>
            Security Audit
          </TableCell>
          <TableCell>
            <Badge variant="outline">
              <Box
                as="span"
                aria-hidden="true"
                {...stylex.props(previewStyles.preview6)}
              />
              Failed
            </Badge>
          </TableCell>
          <TableCell>Security Team</TableCell>
          <TableCell {...stylex.props(previewStyles.preview1)}>
            $2,100
          </TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total Budget</TableCell>
          <TableCell {...stylex.props(previewStyles.preview1)}>
            $39,550
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}

const previewStyles = stylex.create({
  preview1: {
    textAlign: "right",
  },
  preview2: {
    fontWeight: "500",
  },
  preview3: {
    inlineSize: "calc(0.25rem * 1.5)",
    blockSize: "calc(0.25rem * 1.5)",
    borderRadius: "calc(infinity * 1px)",
    backgroundColor: "oklch(69.6% 0.17 162.48)",
  },
  preview4: {
    inlineSize: "calc(0.25rem * 1.5)",
    blockSize: "calc(0.25rem * 1.5)",
    borderRadius: "calc(infinity * 1px)",
    backgroundColor: {
      default: "var(--muted-foreground)",
      "@supports (color: color-mix(in lab, red, red))":
        "color-mix(in oklab, var(--muted-foreground) 64%, transparent)",
    },
  },
  preview5: {
    inlineSize: "calc(0.25rem * 1.5)",
    blockSize: "calc(0.25rem * 1.5)",
    borderRadius: "calc(infinity * 1px)",
    backgroundColor: "oklch(76.9% 0.188 70.08)",
  },
  preview6: {
    inlineSize: "calc(0.25rem * 1.5)",
    blockSize: "calc(0.25rem * 1.5)",
    borderRadius: "calc(infinity * 1px)",
    backgroundColor: "oklch(63.7% 0.237 25.331)",
  },
})
