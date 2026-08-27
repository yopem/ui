// next/link replaced -> anchor
import * as stylex from "@stylexjs/stylex"

import { Button } from "@/components/ui/stylex/button"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/stylex/pagination"

interface PaginationProps {
  currentPage: number
  totalPages: number
}

export default function Particle({ currentPage, totalPages }: PaginationProps) {
  return (
    <Pagination>
      <PaginationContent {...stylex.props(demoStyles.demo1)}>
        <PaginationItem>
          <Button
            disabled={currentPage === 1}
            render={
              currentPage === 1 ? undefined : (
                <a
                  aria-label="Go to previous page"
                  href={`#/page/${currentPage - 1}`}
                />
              )
            }
            variant="outline"
          >
            Previous
          </Button>
        </PaginationItem>
        <PaginationItem>
          <Button
            disabled={currentPage === totalPages}
            render={
              currentPage === totalPages ? undefined : (
                <a
                  aria-label="Go to next page"
                  href={`#/page/${currentPage + 1}`}
                />
              )
            }
            variant="outline"
          >
            Next
          </Button>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

const demoStyles = stylex.create({
  demo1: {
    inlineSize: "100%",
    justifyContent: "space-between",
    gap: "calc(0.25rem * 2)",
  },
})
