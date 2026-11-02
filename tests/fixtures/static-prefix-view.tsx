import { DocumentStatic } from "@yopem-ui/editor/document/static"

function markHydrated(node: HTMLElement | null) {
  if (node?.parentElement) node.parentElement.dataset.hydrated = "true"
}

export function StaticPrefixView({ html }: { html: string }) {
  return (
    <main ref={markHydrated}>
      <div id="yopem-toc-document-heading-1">Host target</div>
      <DocumentStatic
        html={html}
        idPrefix="first"
        aria-label="First document"
      />
      <DocumentStatic
        html={html}
        idPrefix="second"
        aria-label="Second document"
      />
    </main>
  )
}
