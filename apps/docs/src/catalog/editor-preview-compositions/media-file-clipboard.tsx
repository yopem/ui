"use client"

import type { MediaUpload } from "@yopem-ui/editor/media"

import { Box } from "@registry/components/ui/box"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import { EditorContent, EditorRoot, EditorToolbar } from "@yopem-ui/editor"
import { MediaExtension, MediaFileClipboard } from "@yopem-ui/editor/media"

const extensions = [MediaExtension]

const imageUrl = "https://ui.yopem.com/favicon.svg"

function uploadMediaFile(
  file: File,
  { signal, onProgress }: Parameters<MediaUpload>[1],
): ReturnType<MediaUpload> {
  if (!file.type.startsWith("image/") || file.size > 1048576)
    return Promise.reject(new Error("Choose an image up to 1 MiB."))

  if (signal.aborted) return Promise.reject(new Error("Upload cancelled"))

  onProgress(30)

  return new Promise((resolve, reject) => {
    const abort = () => {
      clearTimeout(timeout)
      reject(new Error("Upload cancelled"))
    }

    const timeout = setTimeout(() => {
      signal.removeEventListener("abort", abort)
      onProgress(100)
      resolve(imageUrl)
    }, 500)

    signal.addEventListener("abort", abort, { once: true })
  })
}

const upload: MediaUpload = uploadMediaFile

export function MediaFileClipboardExample() {
  return (
    <Stack>
      <Text>
        This fixture returns an existing image after a short delay. It does not
        upload files to a server. Supply a validated host upload callback in
        your app.
      </Text>
      <Box render={<section />} aria-label="Media file clipboard editor">
        <EditorRoot
          ariaLabel="Media file clipboard content"
          extensions={extensions}
        >
          <EditorToolbar aria-label="Media file tools">
            <MediaFileClipboard upload={upload} />
          </EditorToolbar>
          <EditorContent placeholder="Paste or drop a media file." />
        </EditorRoot>
      </Box>
      <Box render={<section />} aria-label="Unconfigured media file editor">
        <EditorRoot
          ariaLabel="Unconfigured media content"
          extensions={extensions}
        >
          <EditorToolbar aria-label="Unconfigured media tools">
            <MediaFileClipboard />
          </EditorToolbar>
          <EditorContent placeholder="Host upload is not configured." />
        </EditorRoot>
      </Box>
    </Stack>
  )
}
