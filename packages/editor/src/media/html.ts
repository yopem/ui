import type { MediaData } from "./schema"

import { parseMedia } from "./schema"

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
}

export function serializeMediaHtml(value: MediaData) {
  const data = parseMedia(value)
  const url = escapeHtml(data.url)
  const label = escapeHtml(data.alt)
  let content: string

  if (data.kind === "image")
    content = `<img src="${url}" alt="${label}" width="${data.width}">`
  else if (data.kind === "file")
    content = `<a href="${url}" rel="noopener noreferrer">${escapeHtml(data.name)}</a>`
  else if (data.kind === "embed")
    content = `<a href="${url}" rel="noopener noreferrer">${label || "Open embedded media"}</a>`
  else {
    const track = data.trackUrl
      ? `<track kind="captions" src="${escapeHtml(data.trackUrl)}" srclang="en" label="Captions">`
      : ""

    content = `<${data.kind} src="${url}" controls preload="none" aria-label="${label || data.kind}">${track}</${data.kind}>`
  }

  return `<figure data-yopem-media="${escapeHtml(JSON.stringify(data))}" data-alignment="${data.alignment}">${content}${data.caption ? `<figcaption>${escapeHtml(data.caption)}</figcaption>` : ""}</figure>`
}
