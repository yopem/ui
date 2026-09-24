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
const styles = stylex.create({
  tableHead: { textAlign: "right" },
  tableCell: { fontWeight: "500" },
  span: {
    inlineSize: "calc(0.25rem * 1.5)",
    blockSize: "calc(0.25rem * 1.5)",
    borderRadius: "calc(infinity * 1px)",
    backgroundColor: "oklch(69.6% 0.17 162.48)",
  },
  tableCell2: { textAlign: "right" },
  tableCell3: { fontWeight: "500" },
  span2: {
    inlineSize: "calc(0.25rem * 1.5)",
    blockSize: "calc(0.25rem * 1.5)",
    borderRadius: "calc(infinity * 1px)",
    backgroundColor:
      "color-mix(in oklab, var(--muted-foreground) 64%, transparent)",
  },
  tableCell4: { textAlign: "right" },
  tableCell5: { fontWeight: "500" },
  span3: {
    inlineSize: "calc(0.25rem * 1.5)",
    blockSize: "calc(0.25rem * 1.5)",
    borderRadius: "calc(infinity * 1px)",
    backgroundColor: "oklch(76.9% 0.188 70.08)",
  },
  tableCell6: { textAlign: "right" },
  tableCell7: { fontWeight: "500" },
  span4: {
    inlineSize: "calc(0.25rem * 1.5)",
    blockSize: "calc(0.25rem * 1.5)",
    borderRadius: "calc(infinity * 1px)",
    backgroundColor: "oklch(69.6% 0.17 162.48)",
  },
  tableCell8: { textAlign: "right" },
  tableCell9: { fontWeight: "500" },
  span5: {
    inlineSize: "calc(0.25rem * 1.5)",
    blockSize: "calc(0.25rem * 1.5)",
    borderRadius: "calc(infinity * 1px)",
    backgroundColor: "oklch(69.6% 0.17 162.48)",
  },
  tableCell10: { textAlign: "right" },
  tableCell11: { fontWeight: "500" },
  span6: {
    inlineSize: "calc(0.25rem * 1.5)",
    blockSize: "calc(0.25rem * 1.5)",
    borderRadius: "calc(infinity * 1px)",
    backgroundColor: "oklch(63.7% 0.237 25.331)",
  },
  tableCell12: { textAlign: "right" },
  tableCell13: { textAlign: "right" },
})
export function Preview() {
  return (
    <Table>
      <TableCaption>A list of current projects.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Project</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Team</TableHead>
          <TableHead xstyle={styles.tableHead}>Budget</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell xstyle={styles.tableCell}>Website Redesign</TableCell>
          <TableCell>
            <Badge variant="outline">
              <Box as="span" aria-hidden="true" xstyle={styles.span} />
              Paid
            </Badge>
          </TableCell>
          <TableCell>Frontend Team</TableCell>
          <TableCell xstyle={styles.tableCell2}>$12,500</TableCell>
        </TableRow>
        <TableRow>
          <TableCell xstyle={styles.tableCell3}>Mobile App</TableCell>
          <TableCell>
            <Badge variant="outline">
              <Box as="span" aria-hidden="true" xstyle={styles.span2} />
              Unpaid
            </Badge>
          </TableCell>
          <TableCell>Mobile Team</TableCell>
          <TableCell xstyle={styles.tableCell4}>$8,750</TableCell>
        </TableRow>
        <TableRow>
          <TableCell xstyle={styles.tableCell5}>API Integration</TableCell>
          <TableCell>
            <Badge variant="outline">
              <Box as="span" aria-hidden="true" xstyle={styles.span3} />
              Pending
            </Badge>
          </TableCell>
          <TableCell>Backend Team</TableCell>
          <TableCell xstyle={styles.tableCell6}>$5,200</TableCell>
        </TableRow>
        <TableRow>
          <TableCell xstyle={styles.tableCell7}>Database Migration</TableCell>
          <TableCell>
            <Badge variant="outline">
              <Box as="span" aria-hidden="true" xstyle={styles.span4} />
              Paid
            </Badge>
          </TableCell>
          <TableCell>DevOps Team</TableCell>
          <TableCell xstyle={styles.tableCell8}>$3,800</TableCell>
        </TableRow>
        <TableRow>
          <TableCell xstyle={styles.tableCell9}>User Dashboard</TableCell>
          <TableCell>
            <Badge variant="outline">
              <Box as="span" aria-hidden="true" xstyle={styles.span5} />
              Paid
            </Badge>
          </TableCell>
          <TableCell>UX Team</TableCell>
          <TableCell xstyle={styles.tableCell10}>$7,200</TableCell>
        </TableRow>
        <TableRow>
          <TableCell xstyle={styles.tableCell11}>Security Audit</TableCell>
          <TableCell>
            <Badge variant="outline">
              <Box as="span" aria-hidden="true" xstyle={styles.span6} />
              Failed
            </Badge>
          </TableCell>
          <TableCell>Security Team</TableCell>
          <TableCell xstyle={styles.tableCell12}>$2,100</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total Budget</TableCell>
          <TableCell xstyle={styles.tableCell13}>$39,550</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}
