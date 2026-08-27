"use client"

import * as stylex from "@stylexjs/stylex"
import { useState } from "react"

import { Button } from "@/components/ui/stylex/button"
import {
  Drawer,
  DrawerDescription,
  DrawerHeader,
  DrawerPanel,
  DrawerPopup,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/stylex/drawer"

export default function Particle() {
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
          <div {...stylex.props(demoStyles.demo1)}>
            {Array.from({ length: 48 }, (_, i) => `box-${i}`).map((key) => (
              <div {...stylex.props(demoStyles.demo2)} key={key} />
            ))}
          </div>
        </DrawerPanel>
      </DrawerPopup>
    </Drawer>
  )
}

const demoStyles = stylex.create({
  demo1: {
    display: "flex",
    flexDirection: "column",
    gap: "calc(0.25rem * 2)",
  },
  demo2: {
    blockSize: "calc(0.25rem * 12)",
    flexShrink: "0",
    borderRadius: "calc(var(--radius) + 4px)",
    borderStyle: "solid",
    borderWidth: "1px",
    backgroundColor: "var(--muted)",
  },
})
