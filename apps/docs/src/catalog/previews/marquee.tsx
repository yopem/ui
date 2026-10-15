"use client"

import { Marquee } from "@registry/components/ui/marquee"
import { Link } from "@tanstack/react-router"

export function Preview() {
  return (
    <Marquee>
      <Link to="/docs/layout">Layout guide</Link>
      <Link to="/components">Component catalog</Link>
      <Link to="/docs/getting-started">Installation guide</Link>
    </Marquee>
  )
}
