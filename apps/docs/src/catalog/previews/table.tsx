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
          <TableHead textAlign={"right"}>Budget</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell fontWeight={"500"}>Website Redesign</TableCell>
          <TableCell>
            <Badge variant="outline">
              <Box
                as="span"
                aria-hidden="true"
                inlineSize={"calc(0.25rem * 1.5)"}
                blockSize={"calc(0.25rem * 1.5)"}
                borderRadius={"calc(infinity * 1px)"}
                backgroundColor={"oklch(69.6% 0.17 162.48)"}
              />
              Paid
            </Badge>
          </TableCell>
          <TableCell>Frontend Team</TableCell>
          <TableCell textAlign={"right"}>$12,500</TableCell>
        </TableRow>
        <TableRow>
          <TableCell fontWeight={"500"}>Mobile App</TableCell>
          <TableCell>
            <Badge variant="outline">
              <Box
                as="span"
                aria-hidden="true"
                inlineSize={"calc(0.25rem * 1.5)"}
                blockSize={"calc(0.25rem * 1.5)"}
                borderRadius={"calc(infinity * 1px)"}
                backgroundColor="color-mix(in oklab, var(--muted-foreground) 64%, transparent)"
              />
              Unpaid
            </Badge>
          </TableCell>
          <TableCell>Mobile Team</TableCell>
          <TableCell textAlign={"right"}>$8,750</TableCell>
        </TableRow>
        <TableRow>
          <TableCell fontWeight={"500"}>API Integration</TableCell>
          <TableCell>
            <Badge variant="outline">
              <Box
                as="span"
                aria-hidden="true"
                inlineSize={"calc(0.25rem * 1.5)"}
                blockSize={"calc(0.25rem * 1.5)"}
                borderRadius={"calc(infinity * 1px)"}
                backgroundColor={"oklch(76.9% 0.188 70.08)"}
              />
              Pending
            </Badge>
          </TableCell>
          <TableCell>Backend Team</TableCell>
          <TableCell textAlign={"right"}>$5,200</TableCell>
        </TableRow>
        <TableRow>
          <TableCell fontWeight={"500"}>Database Migration</TableCell>
          <TableCell>
            <Badge variant="outline">
              <Box
                as="span"
                aria-hidden="true"
                inlineSize={"calc(0.25rem * 1.5)"}
                blockSize={"calc(0.25rem * 1.5)"}
                borderRadius={"calc(infinity * 1px)"}
                backgroundColor={"oklch(69.6% 0.17 162.48)"}
              />
              Paid
            </Badge>
          </TableCell>
          <TableCell>DevOps Team</TableCell>
          <TableCell textAlign={"right"}>$3,800</TableCell>
        </TableRow>
        <TableRow>
          <TableCell fontWeight={"500"}>User Dashboard</TableCell>
          <TableCell>
            <Badge variant="outline">
              <Box
                as="span"
                aria-hidden="true"
                inlineSize={"calc(0.25rem * 1.5)"}
                blockSize={"calc(0.25rem * 1.5)"}
                borderRadius={"calc(infinity * 1px)"}
                backgroundColor={"oklch(69.6% 0.17 162.48)"}
              />
              Paid
            </Badge>
          </TableCell>
          <TableCell>UX Team</TableCell>
          <TableCell textAlign={"right"}>$7,200</TableCell>
        </TableRow>
        <TableRow>
          <TableCell fontWeight={"500"}>Security Audit</TableCell>
          <TableCell>
            <Badge variant="outline">
              <Box
                as="span"
                aria-hidden="true"
                inlineSize={"calc(0.25rem * 1.5)"}
                blockSize={"calc(0.25rem * 1.5)"}
                borderRadius={"calc(infinity * 1px)"}
                backgroundColor={"oklch(63.7% 0.237 25.331)"}
              />
              Failed
            </Badge>
          </TableCell>
          <TableCell>Security Team</TableCell>
          <TableCell textAlign={"right"}>$2,100</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total Budget</TableCell>
          <TableCell textAlign={"right"}>$39,550</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}
