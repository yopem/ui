// next/link replaced -> anchor
import { Button } from "@/components/ui/tailwind/button"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/tailwind/pagination"

type PaginationProps = {
  currentPage: number
  totalPages: number
}

export default function Particle({ currentPage, totalPages }: PaginationProps) {
  return (
    <Pagination>
      <PaginationContent className="w-full justify-between gap-2">
        <PaginationItem>
          <Button
            disabled={currentPage === 1}
            render={
              currentPage === 1 ? undefined : (
                <a href={`#/page/${currentPage - 1}`} />
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
                <a href={`#/page/${currentPage + 1}`} />
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
