"use client"

import { useState } from "react"

import { Box } from "@/components/ui/box"
import { Button } from "@/components/ui/button"
import { Flex } from "@/components/ui/flex"
import { Heading } from "@/components/ui/heading"
import { Paragraph } from "@/components/ui/paragraph"
export function Preview() {
  const [activations, setActivations] = useState(0)

  return (
    <Box
      as="section"
      aria-label="Style props playground"
      display={"flex"}
      flexDirection={"column"}
      gap={"1.5rem"}
      maxInlineSize={"64rem"}
      minInlineSize={0}
      padding={"1rem"}
    >
      <Heading as="h2">Style props</Heading>
      <Paragraph>
        Numbers use the spacing scale; CSS strings keep their units.
      </Paragraph>
      <Flex flexWrap={"wrap"} gap={"1.5rem"}>
        <Button p={4}>Numeric padding</Button>
        <Button p="13px">Raw padding</Button>
        <Button p={[2, null, 6]}>Responsive array</Button>
        <Button p={{ base: 2, md: 4, lg: 6 }}>Responsive object</Button>
        <Button p={{ base: 2, mdToLg: 5 }}>Responsive range</Button>
      </Flex>
      <Paragraph>
        Logical spacing follows writing direction, including negative margins.
      </Paragraph>
      <Flex dir="ltr" flexWrap={"wrap"} gap={"1.5rem"}>
        <Button ps={6} pe={2} ms={-2}>
          Logical LTR
        </Button>
      </Flex>
      <Flex dir="rtl" flexWrap={"wrap"} gap={"1.5rem"}>
        <Button ps={6} pe={2} ms={-2}>
          Logical RTL
        </Button>
      </Flex>
      <Button gap={3}>
        <Box as="span">Scaled</Box>
        <Box as="span">space</Box>
      </Button>
      <Button gap={0} spaceX={-2}>
        <Box as="span" paddingInline={"0.75rem"}>
          Negative
        </Box>
        <Box as="span" paddingInline={"0.75rem"}>
          space
        </Box>
      </Button>
      <Paragraph>
        Hover, keyboard focus, and disabled states keep native behavior.
      </Paragraph>
      <Flex flexWrap={"wrap"} gap={"1.5rem"}>
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
        Direct style props override base spacing and compose with responsive and
        state styles.
      </Paragraph>
      <Flex flexWrap={"wrap"} gap={"1.5rem"}>
        <Button p={4} paddingBlock="28px" paddingInline="28px">
          Direct prop precedence
        </Button>
        <Button p={4} paddingBlock="28px" paddingInline="28px">
          Inline precedence
        </Button>
        <Button
          p={4}
          paddingBlock="28px"
          paddingInline="28px"
          borderTopWidth="5px"
        >
          Border width
        </Button>
      </Flex>
    </Box>
  )
}
