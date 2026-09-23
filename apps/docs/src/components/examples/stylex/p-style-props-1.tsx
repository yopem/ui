"use client"

import * as stylex from "@stylexjs/stylex"
import { useState } from "react"

import { Box } from "@/components/ui/box"
import { Button } from "@/components/ui/button"
import { Flex } from "@/components/ui/flex"
import { Heading } from "@/components/ui/heading"
import { Paragraph } from "@/components/ui/paragraph"
export function Example() {
  const [activations, setActivations] = useState(0)

  return (
    <Box
      as="section"
      aria-label="Style props playground"
      {...stylex.props(styles.root)}
    >
      <Heading as="h2">Style props</Heading>
      <Paragraph>
        Numbers use the spacing scale; CSS strings keep their units.
      </Paragraph>
      <Flex {...stylex.props(styles.row)}>
        <Button p={4}>Numeric padding</Button>
        <Button p="13px">Raw padding</Button>
        <Button p={[2, null, 6]}>Responsive array</Button>
        <Button p={{ base: 2, md: 4, lg: 6 }}>Responsive object</Button>
        <Button p={{ base: 2, mdToLg: 5 }}>Responsive range</Button>
      </Flex>
      <Paragraph>
        Logical spacing follows writing direction, including negative margins.
      </Paragraph>
      <Flex dir="ltr" {...stylex.props(styles.row)}>
        <Button ps={6} pe={2} ms={-2}>
          Logical LTR
        </Button>
      </Flex>
      <Flex dir="rtl" {...stylex.props(styles.row)}>
        <Button ps={6} pe={2} ms={-2}>
          Logical RTL
        </Button>
      </Flex>
      <Button gap={3}>
        <Box as="span">Scaled</Box>
        <Box as="span">space</Box>
      </Button>
      <Button gap={0} spaceX={-2}>
        <Box as="span" {...stylex.props(styles.spaceItem)}>
          Negative
        </Box>
        <Box as="span" {...stylex.props(styles.spaceItem)}>
          space
        </Box>
      </Button>
      <Paragraph>
        Hover, keyboard focus, and disabled states keep native behavior.
      </Paragraph>
      <Flex {...stylex.props(styles.row)}>
        <Button
          p={4}
          _hover={{ p: 6 }}
          _focusVisible={{
            outlineStyle: "solid",
            outlineWidth: "2px",
            outlineOffset: "6px",
          }}
          onClick={() => setActivations((count) => count + 1)}
        >
          Interactive styles
        </Button>
        <Button disabled p={4} _disabled={{ opacity: 0.4 }}>
          Disabled styles
        </Button>
        <Button>After disabled</Button>
      </Flex>
      <Box as="output" aria-live="polite">
        Activations: {activations}
      </Box>
      <Paragraph>
        Explicit xstyle overrides style props. Inline CSS keeps native
        precedence; className is preserved.
      </Paragraph>
      <Flex {...stylex.props(styles.row)}>
        <Button p={4} xstyle={styles.override}>
          Xstyle precedence
        </Button>
        <Button p={4} xstyle={styles.override}>
          Inline precedence
        </Button>
        <Button
          p={4}
          xstyle={styles.override}
          className={stylex.props(styles.consumerClass).className}
        >
          Consumer class
        </Button>
      </Flex>
    </Box>
  )
}

const styles = stylex.create({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
    maxInlineSize: "64rem",
    minInlineSize: 0,
    padding: "1rem",
  },
  row: {
    display: "flex",
    flexWrap: "wrap",
    gap: "1.5rem",
  },
  spaceItem: { paddingInline: "0.75rem" },
  override: { paddingBlock: "28px", paddingInline: "28px" },
  consumerClass: { borderTopWidth: "5px" },
})
