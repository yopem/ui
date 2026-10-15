"use client"

import { Marquee } from "@registry/components/ui/marquee"
import { Link } from "@tanstack/react-router"

export function Preview() {
  return (
    <Marquee>
      <Link to="/docs/layout">Design systems</Link>
      <Link to="/components">Accessible components</Link>
      <Link to="/docs/getting-started">Reusable source</Link>
    </Marquee>
  )
}
