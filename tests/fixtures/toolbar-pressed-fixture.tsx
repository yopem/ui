"use client"

import type { ComponentProps, MouseEvent, ReactElement } from "react"

import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Toolbar, ToolbarButton } from "@registry/components/ui/toolbar"
import * as stylex from "@stylexjs/stylex"
import { useState } from "react"

const styles = stylex.create({ toolbar: { flexWrap: "wrap" } })

type RenderFunction = Exclude<
  NonNullable<ComponentProps<typeof ToolbarButton>["render"]>,
  ReactElement
>

type RenderProps = Parameters<RenderFunction>[0]

function renderTrue(props: RenderProps) {
  return <Button {...props} variant="ghost" aria-pressed={true} />
}

function renderFalse(props: RenderProps) {
  return <Button {...props} variant="ghost" aria-pressed={false} />
}

function renderMixed(props: RenderProps) {
  return <Button {...props} variant="ghost" aria-pressed="mixed" />
}

export function ToolbarPressedFixture() {
  const [pressed, setPressed] = useState(false)
  const [cancelled, setCancelled] = useState(0)

  function togglePressed() {
    setPressed((value) => !value)
  }

  function handleCancelledToolbarClick(event: MouseEvent<HTMLElement>) {
    if (!event.defaultPrevented) setPressed(true)
  }

  function handleCancelledButtonClick(event: MouseEvent<HTMLElement>) {
    event.preventDefault()
    setCancelled((count) => count + 1)
  }

  return (
    <Box render={<section />} aria-label="Pressed state fixture">
      <Toolbar aria-label="Pressed state cases" xstyle={styles.toolbar}>
        <ToolbarButton aria-pressed={true} render={<Button variant="ghost" />}>
          Boolean true
        </ToolbarButton>
        <ToolbarButton aria-pressed="true" render={<Button variant="ghost" />}>
          String true
        </ToolbarButton>
        <ToolbarButton aria-pressed={false} render={<Button variant="ghost" />}>
          Boolean false
        </ToolbarButton>
        <ToolbarButton aria-pressed="false" render={<Button variant="ghost" />}>
          String false
        </ToolbarButton>
        <ToolbarButton aria-pressed="mixed" render={<Button variant="ghost" />}>
          Mixed
        </ToolbarButton>
        <ToolbarButton render={<Button variant="ghost" aria-pressed={true} />}>
          Render only true
        </ToolbarButton>
        <ToolbarButton
          aria-pressed={false}
          render={<Button variant="ghost" aria-pressed={true} />}
        >
          Render overrides false
        </ToolbarButton>
        <ToolbarButton
          aria-pressed={true}
          render={<Button variant="ghost" aria-pressed={false} />}
        >
          Render overrides true
        </ToolbarButton>
        <ToolbarButton
          aria-pressed={true}
          render={<Button variant="ghost" aria-pressed="mixed" />}
        >
          Render overrides mixed
        </ToolbarButton>
        <ToolbarButton
          aria-pressed={true}
          render={
            <Button
              variant="ghost"
              render={
                <button
                  type="button"
                  aria-label="Nested overrides true"
                  aria-pressed={false}
                />
              }
            />
          }
        >
          Nested overrides true
        </ToolbarButton>
        <ToolbarButton aria-pressed={false} render={renderTrue}>
          Callback overrides false
        </ToolbarButton>
        <ToolbarButton aria-pressed={true} render={renderFalse}>
          Callback overrides true
        </ToolbarButton>
        <ToolbarButton aria-pressed={true} render={renderMixed}>
          Callback overrides mixed
        </ToolbarButton>
        <ToolbarButton
          aria-pressed={false}
          data-pressed=""
          render={<Button variant="ghost" />}
        >
          Explicit marker
        </ToolbarButton>
        <ToolbarButton
          aria-pressed={true}
          data-pressed={undefined}
          render={<Button variant="ghost" />}
        >
          Undefined marker
        </ToolbarButton>
        <ToolbarButton
          aria-pressed={true}
          disabled
          render={<Button variant="ghost" />}
        >
          Disabled true
        </ToolbarButton>
        <ToolbarButton
          aria-pressed={pressed}
          onClick={togglePressed}
          render={<Button variant="ghost" />}
        >
          Controlled
        </ToolbarButton>
        <ToolbarButton
          aria-pressed={false}
          onClick={handleCancelledToolbarClick}
          render={
            <Button variant="ghost" onClick={handleCancelledButtonClick} />
          }
        >
          Cancelled
        </ToolbarButton>
      </Toolbar>
      <Button variant="ghost" aria-pressed={true}>
        Standalone true
      </Button>
      <Button variant="ghost" aria-pressed={false}>
        Standalone false
      </Button>
      <Button variant="ghost" aria-pressed="mixed">
        Standalone mixed
      </Button>
      <Box render={<output />}>{cancelled}</Box>
    </Box>
  )
}
