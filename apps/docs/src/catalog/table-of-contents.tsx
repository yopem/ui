"use client"

import type { ReactNode } from "react"

import { tokens } from "@registry/styles/tokens.stylex"
import { useCallback, useState } from "react"

import { Box } from "@/components/ui/box"
import { Link } from "@/components/ui/link"
import { Paragraph } from "@/components/ui/paragraph"
export interface TocItem {
  title: ReactNode
  url: string
  depth: number
}

function listenForActiveSection(
  items: TocItem[],
  onActiveUrlChange: (url: string) => void,
) {
  const headings = items
    .map((item) => document.getElementById(item.url.slice(1)))
    .filter((heading) => heading !== null)
  if (headings.length === 0) return
  let frame = 0

  function updateActiveSection() {
    let activeHeading = headings[0]
    for (const heading of headings) {
      if (heading.getBoundingClientRect().top > 112) break
      activeHeading = heading
    }
    onActiveUrlChange(`#${activeHeading.id}`)
  }

  function scheduleUpdate() {
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(updateActiveSection)
  }

  updateActiveSection()
  window.addEventListener("scroll", scheduleUpdate, { passive: true })
  window.addEventListener("resize", scheduleUpdate)
  return () => {
    cancelAnimationFrame(frame)
    window.removeEventListener("scroll", scheduleUpdate)
    window.removeEventListener("resize", scheduleUpdate)
  }
}

export function TableOfContents({ items }: { items: TocItem[] }) {
  const [activeUrl, setActiveUrl] = useState<string>()
  const trackSections = useCallback(
    (node: HTMLElement | null) => {
      if (!node) return
      return listenForActiveSection(items, setActiveUrl)
    },
    [items],
  )

  return (
    <Box
      as="aside"
      aria-label="On this page"
      ref={trackSections}
      display={{ base: "none", "2xl": "block" }}
      position={"sticky"}
      insetBlockStart={"6rem"}
      alignSelf={"start"}
      maxBlockSize={"calc(100dvh - 8rem)"}
      overflowY={"auto"}
      overscrollBehavior={"contain"}
      fontSize={"0.8125rem"}
    >
      <Box as="nav" aria-label="On this page">
        <Paragraph fontWeight={600} marginBlock={"0 1rem"}>
          On this page
        </Paragraph>
        <Box
          as="ul"
          listStyleType={"none"}
          padding={0}
          margin={0}
          display={"grid"}
          gap={"0.75rem"}
        >
          {items.map((item) => (
            <Box as="li" key={item.url}>
              <Link
                aria-current={activeUrl === item.url ? "location" : undefined}
                href={item.url}
                display="block"
                color={tokens["--muted-foreground"]}
                textDecoration="none"
                lineHeight={1.5}
                paddingInlineStart="0.75rem"
                position="relative"
                transitionDuration={{ base: "160ms", _motionReduce: "0ms" }}
                transitionProperty="color"
                transitionTimingFunction="ease"
                _hover={{ color: tokens["--foreground"] }}
                _focusVisible={{
                  outlineColor: tokens["--ring"],
                  outlineStyle: "solid",
                  outlineWidth: 2,
                  outlineOffset: 2,
                }}
              >
                {activeUrl === item.url ? (
                  <Box
                    as="span"
                    color={tokens["--foreground"]}
                    fontWeight={600}
                  >
                    <Box
                      as="span"
                      aria-hidden="true"
                      backgroundColor={tokens["--foreground"]}
                      borderRadius="999px"
                      inlineSize="2px"
                      insetBlock="0.125rem"
                      insetInlineStart={0}
                      position="absolute"
                    />
                    {item.depth > 2 ? (
                      <Box as="span" paddingInlineStart="0.75rem">
                        {item.title}
                      </Box>
                    ) : (
                      item.title
                    )}
                  </Box>
                ) : item.depth > 2 ? (
                  <Box as="span" paddingInlineStart="0.75rem">
                    {item.title}
                  </Box>
                ) : (
                  item.title
                )}
              </Link>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  )
}
