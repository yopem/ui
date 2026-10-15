import { Badge } from "@registry/components/ui/badge"
import { Box } from "@registry/components/ui/box"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@registry/components/ui/table"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  tableHead: { textAlign: "right" },
  tableCell: { fontWeight: "500" },
  span: {
    inlineSize: "calc(0.25rem * 1.5)",
    blockSize: "calc(0.25rem * 1.5)",
    borderRadius: "calc(infinity * 1px)",
    backgroundColor: tokens["--success"],
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
    backgroundColor: tokens["--warning"],
  },
  tableCell6: { textAlign: "right" },
  tableCell7: { fontWeight: "500" },
  span4: {
    inlineSize: "calc(0.25rem * 1.5)",
    blockSize: "calc(0.25rem * 1.5)",
    borderRadius: "calc(infinity * 1px)",
    backgroundColor: tokens["--success"],
  },
  tableCell8: { textAlign: "right" },
  tableCell9: { fontWeight: "500" },
  span5: {
    inlineSize: "calc(0.25rem * 1.5)",
    blockSize: "calc(0.25rem * 1.5)",
    borderRadius: "calc(infinity * 1px)",
    backgroundColor: tokens["--success"],
  },
  tableCell10: { textAlign: "right" },
  tableCell11: { fontWeight: "500" },
  span6: {
    inlineSize: "calc(0.25rem * 1.5)",
    blockSize: "calc(0.25rem * 1.5)",
    borderRadius: "calc(infinity * 1px)",
    backgroundColor: tokens["--destructive"],
  },
  tableCell12: { textAlign: "right" },
  tableCell13: { textAlign: "right" },
})

export function Preview() {
  return (
    <Table>
      <TableCaption>Equipment reservations for the field station.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Visit</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Group</TableHead>
          <TableHead xstyle={styles.tableHead}>Deposit</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell xstyle={styles.tableCell}>Dawn bird count</TableCell>
          <TableCell>
            <Badge variant="outline">
              <Box render={<span />} aria-hidden="true" xstyle={styles.span} />
              Paid
            </Badge>
          </TableCell>
          <TableCell>Reed watchers</TableCell>
          <TableCell xstyle={styles.tableCell2}>$120</TableCell>
        </TableRow>
        <TableRow>
          <TableCell xstyle={styles.tableCell3}>River sound survey</TableCell>
          <TableCell>
            <Badge variant="outline">
              <Box render={<span />} aria-hidden="true" xstyle={styles.span2} />
              Unpaid
            </Badge>
          </TableCell>
          <TableCell>Listening group</TableCell>
          <TableCell xstyle={styles.tableCell4}>$80</TableCell>
        </TableRow>
        <TableRow>
          <TableCell xstyle={styles.tableCell5}>Water sample round</TableCell>
          <TableCell>
            <Badge variant="outline">
              <Box render={<span />} aria-hidden="true" xstyle={styles.span3} />
              Pending
            </Badge>
          </TableCell>
          <TableCell>Water volunteers</TableCell>
          <TableCell xstyle={styles.tableCell6}>$60</TableCell>
        </TableRow>
        <TableRow>
          <TableCell xstyle={styles.tableCell7}>Meadow survey</TableCell>
          <TableCell>
            <Badge variant="outline">
              <Box render={<span />} aria-hidden="true" xstyle={styles.span4} />
              Paid
            </Badge>
          </TableCell>
          <TableCell>Meadow group</TableCell>
          <TableCell xstyle={styles.tableCell8}>$40</TableCell>
        </TableRow>
        <TableRow>
          <TableCell xstyle={styles.tableCell9}>Trail sign check</TableCell>
          <TableCell>
            <Badge variant="outline">
              <Box render={<span />} aria-hidden="true" xstyle={styles.span5} />
              Paid
            </Badge>
          </TableCell>
          <TableCell>Trail stewards</TableCell>
          <TableCell xstyle={styles.tableCell10}>$50</TableCell>
        </TableRow>
        <TableRow>
          <TableCell xstyle={styles.tableCell11}>
            Night wildlife watch
          </TableCell>
          <TableCell>
            <Badge variant="outline">
              <Box render={<span />} aria-hidden="true" xstyle={styles.span6} />
              Failed
            </Badge>
          </TableCell>
          <TableCell>Night observers</TableCell>
          <TableCell xstyle={styles.tableCell12}>$90</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total deposits</TableCell>
          <TableCell xstyle={styles.tableCell13}>$440</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}
