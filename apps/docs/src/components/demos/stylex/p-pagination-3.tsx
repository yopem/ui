"use client"

import * as stylex from "@stylexjs/stylex"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/stylex/button"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/stylex/pagination"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/stylex/select"

interface PaginationProps {
  currentPage?: number
  totalPages?: number
  totalResults: number
  resultsPerPage?: number
}

export default function Particle({
  currentPage: initialPage = 1,
  totalPages = 10,
  totalResults,
  resultsPerPage = 10,
}: PaginationProps) {
  const [currentPage, setCurrentPage] = useState(initialPage)
  const resultRanges = Array.from({ length: totalPages }, (_, i) => {
    const start = i * resultsPerPage + 1
    const end = Math.min((i + 1) * resultsPerPage, totalResults)
    const pageNum = i + 1
    return { label: `${start}-${end}`, value: pageNum }
  })

  return (
    <div {...stylex.props(demoStyles.demo1)}>
      {/* Results range selector */}
      <div {...stylex.props(demoStyles.demo2)}>
        <p {...stylex.props(demoStyles.demo3)}>Viewing</p>
        <Select
          items={resultRanges}
          onValueChange={(value) => setCurrentPage(value as number)}
          value={currentPage}
        >
          <SelectTrigger
            aria-label="Select result range"
            {...stylex.props(demoStyles.report1, demoStyles.report1Manual)}
            size="sm"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectPopup>
            {resultRanges.map(({ label, value }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectPopup>
        </Select>
        <p {...stylex.props(demoStyles.demo3)}>
          of <strong {...stylex.props(demoStyles.demo4)}>{totalResults}</strong>{" "}
          results
        </p>
      </div>

      {/* Pagination */}
      <div>
        <Pagination>
          <PaginationContent {...stylex.props(demoStyles.demo5)}>
            <PaginationItem>
              <Button
                disabled={currentPage === 1 ? true : undefined}
                onClick={() =>
                  currentPage > 1 && setCurrentPage(currentPage - 1)
                }
                size="sm"
                variant="outline"
              >
                <ChevronLeftIcon
                  aria-hidden="true"
                  {...stylex.props(demoStyles.icon, demoStyles.report2)}
                />
                Previous
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button
                disabled={currentPage === totalPages ? true : undefined}
                onClick={() =>
                  currentPage < totalPages && setCurrentPage(currentPage + 1)
                }
                size="sm"
                variant="outline"
              >
                Next
                <ChevronRightIcon
                  aria-hidden="true"
                  {...stylex.props(demoStyles.icon, demoStyles.report2)}
                />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}

const demoStyles = stylex.create({
  icon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
    marginInline: "-0.125rem",
  },
  demo1: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "calc(0.25rem * 2)",
  },
  demo2: {
    display: "flex",
    alignItems: "center",
    gap: "calc(0.25rem * 2)",
    whiteSpace: "nowrap",
  },
  demo3: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    color: "var(--muted-foreground)",
  },
  demo4: {
    fontWeight: "500",
    color: "var(--foreground)",
  },
  demo5: {
    inlineSize: "100%",
    justifyContent: "space-between",
    gap: "calc(0.25rem * 2)",
  },
  report1: {
    inlineSize: "fit-content",
  },
  report1Manual: {
    minInlineSize: 0,
  },
  report2: {
    "@media (min-width: 640px)": {
      display: "none",
    },
  },
})
