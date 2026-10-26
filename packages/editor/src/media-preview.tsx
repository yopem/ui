"use client"

import type { ComponentProps, MouseEventHandler, ReactNode } from "react"

import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@registry/components/ui/dialog"
import { Figcaption } from "@registry/components/ui/figcaption"
import { ScrollArea } from "@registry/components/ui/scroll-area"
import { Slider } from "@registry/components/ui/slider"
import { Stack } from "@registry/components/ui/stack"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { createContext, useContext, useState } from "react"

import { safeMediaUrl } from "./media/schema"

const zoomLevels = [50, 100, 150, 200, 250, 300] as const

type ZoomLevel = (typeof zoomLevels)[number]

function isZoomLevel(value: number): value is ZoomLevel {
  return zoomLevels.some((level) => level === value)
}

export type MediaPreviewImage = Readonly<{
  id: string
  src: string
  alt: string
  caption?: string
}>

type PreviewContextValue = Readonly<{
  disabled: boolean
  images: readonly MediaPreviewImage[]
  activeImage: MediaPreviewImage | null
  activeIndex: number
  open(this: void, imageId: string): void
  close(this: void): void
  setZoom(this: void, value: number): void
  zoom: ZoomLevel
  setPortalContainer(this: void, element: HTMLElement | null): void
  portalContainer: HTMLElement | null
}>

type PreviewActions = Pick<
  PreviewContextValue,
  "open" | "close" | "setZoom" | "setPortalContainer"
>

type PreviewState = Omit<PreviewContextValue, keyof PreviewActions>

const MediaPreviewContext = createContext<PreviewState | null>(null)

const MediaPreviewActionsContext = createContext<PreviewActions | null>(null)

const styles = stylex.create({
  trigger: {
    backgroundColor: "transparent",
    borderWidth: 0,
    borderRadius: tokens["--radius-md"],
    cursor: "zoom-in",
    display: "block",
    maxInlineSize: "100%",
    minBlockSize: 44,
    minInlineSize: 44,
    overflow: "hidden",
    padding: 0,
  },
  popup: {
    maxBlockSize: "calc(100dvh - 2rem)",
    maxInlineSize: "min(72rem, 100%)",
    minBlockSize: 0,
    overflow: "auto",
  },
  body: { minBlockSize: 0, padding: `calc(${tokens["--spacing"]} * 4)` },
  figure: { margin: 0, minBlockSize: 0 },
  imageViewport: {
    blockSize: "min(65dvh, 40rem)",
    inlineSize: "100%",
    minBlockSize: "12rem",
    minInlineSize: 0,
  },
  image: {
    display: "block",
    maxBlockSize: "65dvh",
    maxInlineSize: "100%",
    objectFit: "contain",
    transformOrigin: "top left",
  },
  zoom50: { transform: "scale(0.5)" },
  zoom100: { transform: "scale(1)" },
  zoom150: { transform: "scale(1.5)" },
  zoom200: { transform: "scale(2)" },
  zoom250: { transform: "scale(2.5)" },
  zoom300: { transform: "scale(3)" },
  controls: {
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  target: { minBlockSize: 44, minInlineSize: 44 },
  slider: { inlineSize: "min(16rem, 100%)", minBlockSize: 44 },
  status: { minInlineSize: "4rem", textAlign: "center" },
})

const zoomStyles = {
  50: styles.zoom50,
  100: styles.zoom100,
  150: styles.zoom150,
  200: styles.zoom200,
  250: styles.zoom250,
  300: styles.zoom300,
}

export function MediaPreviewRoot({
  images,
  disabled = false,
  children,
}: {
  images: readonly MediaPreviewImage[]
  disabled?: boolean
  children: ReactNode
}) {
  const safeImages = images.map((image) => ({
    ...image,
    src: safeMediaUrl(image.src),
  }))

  const revision = JSON.stringify(
    safeImages.map(({ id, src, alt, caption }) => [id, src, alt, caption]),
  )

  return (
    <MediaPreviewRootState
      key={JSON.stringify([revision, disabled])}
      disabled={disabled}
      images={safeImages}
    >
      {children}
    </MediaPreviewRootState>
  )
}

function MediaPreviewRootState({
  images,
  disabled,
  children,
}: {
  images: readonly MediaPreviewImage[]
  disabled: boolean
  children: ReactNode
}) {
  const [value, setValue] = useState<PreviewState>(() => ({
    disabled,
    images,
    activeImage: null,
    activeIndex: -1,
    zoom: 100,
    portalContainer: null,
  }))

  const [actions] = useState<PreviewActions>(() => ({
    open(imageId) {
      if (disabled) return
      const activeIndex = images.findIndex((image) => image.id === imageId)
      const activeImage = images[activeIndex]

      if (!activeImage) return
      setValue((previous) => ({
        ...previous,
        activeIndex,
        activeImage,
        zoom: 100,
      }))
    },
    close() {
      setValue((previous) => ({
        ...previous,
        activeImage: null,
        activeIndex: -1,
        zoom: 100,
      }))
    },
    setZoom(zoom) {
      if (!isZoomLevel(zoom)) return
      setValue((previous) =>
        previous.zoom === zoom ? previous : { ...previous, zoom },
      )
    },
    setPortalContainer(portalContainer) {
      setValue((previous) =>
        previous.portalContainer === portalContainer
          ? previous
          : { ...previous, portalContainer },
      )
    },
  }))

  return (
    <Dialog
      open={value.activeImage !== null}
      onOpenChange={(open) => {
        if (!open) actions.close()
      }}
    >
      <MediaPreviewContext.Provider value={value}>
        <MediaPreviewActionsContext.Provider value={actions}>
          {children}
        </MediaPreviewActionsContext.Provider>
      </MediaPreviewContext.Provider>
    </Dialog>
  )
}

export function MediaPreviewTrigger({
  imageId,
  children,
  disabled = false,
  className,
  xstyle,
  onClick,
}: {
  imageId: string
  children: ReactNode
  disabled?: boolean
  className?: ComponentProps<typeof Button>["className"]
  xstyle?: ComponentProps<typeof Button>["xstyle"]
  onClick?: MouseEventHandler<HTMLButtonElement>
}) {
  const context = useMediaPreviewContext()
  const image = context.images.find((item) => item.id === imageId)

  const imageName =
    [image?.alt, image?.caption].find((label) => label?.trim()) ?? "Image"

  const [setTriggerRef] = useState(() => (element: HTMLElement | null) => {
    if (element) context.setPortalContainer(element.ownerDocument.body)
  })

  return (
    <DialogTrigger
      ref={setTriggerRef}
      render={
        <Button
          type="button"
          variant="ghost"
          xstyle={[styles.trigger, xstyle]}
          className={className}
        />
      }
      data-slot="media-preview-trigger"
      aria-label={`Preview image: ${imageName}`}
      disabled={disabled || context.disabled || !image}
      onClick={(event) => {
        onClick?.(event)

        if (event.defaultPrevented || disabled || context.disabled || !image)
          return
        context.open(imageId)
      }}
    >
      {children}
    </DialogTrigger>
  )
}

export function MediaPreviewDialog({ children }: { children?: ReactNode }) {
  const context = useMediaPreviewContext()
  const image = context.activeImage

  if (!image) return null

  const previousImage = context.images[context.activeIndex - 1]
  const nextImage = context.images[context.activeIndex + 1]

  function navigate(imageId: string) {
    context.open(imageId)
  }

  function changeZoomBy(delta: number) {
    context.setZoom(Math.max(50, Math.min(300, context.zoom + delta)))
  }

  return (
    <DialogPopup
      xstyle={styles.popup}
      portalProps={{ container: context.portalContainer }}
    >
      <DialogHeader>
        <DialogTitle>{image.alt || "Image preview"}</DialogTitle>
        <DialogDescription>
          Image {context.activeIndex + 1} of {context.images.length}
        </DialogDescription>
      </DialogHeader>
      <Stack xstyle={styles.body}>
        <Box render={<figure />} xstyle={styles.figure}>
          <ScrollArea aria-label="Image preview" xstyle={styles.imageViewport}>
            <img
              {...stylex.props(styles.image, zoomStyles[context.zoom])}
              src={image.src}
              alt={image.alt}
              data-zoom={context.zoom}
              draggable={false}
            />
          </ScrollArea>
          {image.caption ? <Figcaption>{image.caption}</Figcaption> : null}
        </Box>
        <Stack xstyle={styles.controls}>
          <Button
            type="button"
            variant="outline"
            xstyle={styles.target}
            disabled={!previousImage}
            onClick={(event) => {
              if (!event.defaultPrevented && previousImage)
                navigate(previousImage.id)
            }}
          >
            Previous image
          </Button>
          <Button
            type="button"
            variant="outline"
            xstyle={styles.target}
            disabled={!nextImage}
            onClick={(event) => {
              if (!event.defaultPrevented && nextImage) navigate(nextImage.id)
            }}
          >
            Next image
          </Button>
          <Button
            type="button"
            variant="outline"
            xstyle={styles.target}
            disabled={context.zoom === 50}
            onClick={(event) => {
              if (!event.defaultPrevented) changeZoomBy(-50)
            }}
          >
            Zoom out
          </Button>
          <Slider
            aria-label="Image zoom"
            min={50}
            max={300}
            step={50}
            value={context.zoom}
            onValueChange={(value) =>
              context.setZoom(
                Array.isArray(value) ? (value[0] ?? context.zoom) : value,
              )
            }
            xstyle={styles.slider}
          />
          <Box
            render={<output aria-label="Image zoom level" aria-live="polite" />}
            xstyle={styles.status}
          >
            {context.zoom}%
          </Box>
          <Button
            type="button"
            variant="outline"
            xstyle={styles.target}
            disabled={context.zoom === 300}
            onClick={(event) => {
              if (!event.defaultPrevented) changeZoomBy(50)
            }}
          >
            Zoom in
          </Button>
        </Stack>
        {children}
      </Stack>
    </DialogPopup>
  )
}

export function MediaPreviewGallery({
  images,
  disabled,
  children,
}: {
  images: readonly MediaPreviewImage[]
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <MediaPreviewRoot images={images} disabled={disabled}>
      {children}
      <MediaPreviewDialog />
    </MediaPreviewRoot>
  )
}

function useMediaPreviewContext() {
  const value = useContext(MediaPreviewContext)
  const actions = useContext(MediaPreviewActionsContext)

  if (!value || !actions)
    throw new Error("MediaPreview parts need MediaPreviewRoot.")

  return { ...value, ...actions }
}
