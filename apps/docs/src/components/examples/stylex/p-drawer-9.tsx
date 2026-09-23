"use client"

import * as stylex from "@stylexjs/stylex"
import { useState } from "react"

import { Box } from "@/components/ui/box"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerDescription,
  DrawerHeader,
  DrawerPanel,
  DrawerPopup,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Flex } from "@/components/ui/flex"
export default function Example() {
  const snapPoints = ["300px", 1] as const
  const [snapPoint, setSnapPoint] = useState<
    (typeof snapPoints)[number] | null
  >(snapPoints[0])

  return (
    <Drawer
      onSnapPointChange={(point) =>
        setSnapPoint(point as (typeof snapPoints)[number] | null)
      }
      position="bottom"
      snapPoint={snapPoint}
      snapPoints={[...snapPoints]}
      snapToSequentialPoints
    >
      <DrawerTrigger render={<Button variant="outline" />}>
        With snap points
      </DrawerTrigger>
      <DrawerPopup showBar>
        <DrawerHeader>
          <DrawerTitle>Snap Points</DrawerTitle>
          <DrawerDescription>
            Drag the drawer to snap between a compact peek and full-height view.
          </DrawerDescription>
        </DrawerHeader>
        <DrawerPanel>
          <Flex {...stylex.props(exampleStyles.example1)}>
            {Array.from({ length: 48 }, (_, i) => `box-${i}`).map((key) => (
              <Box {...stylex.props(exampleStyles.example2)} key={key} />
            ))}
          </Flex>
        </DrawerPanel>
      </DrawerPopup>
    </Drawer>
  )
}

const exampleStyles = stylex.create({
  example1: {
    display: "flex",
    flexDirection: "column",
    gap: "calc(0.25rem * 2)",
  },
  example2: {
    blockSize: "calc(0.25rem * 12)",
    flexShrink: "0",
    borderRadius: "calc(var(--radius) + 4px)",
    borderStyle: "solid",
    borderWidth: "1px",
    backgroundColor: "var(--muted)",
  },
})
