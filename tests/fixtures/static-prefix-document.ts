import { createStaticTocFixture } from "./static-toc"

export function staticPrefixDocument() {
  const { html } = createStaticTocFixture(2)

  return `${html}<p>Notes<sup data-editor-footnote-reference="note">1</sup><sup data-editor-footnote-reference="note">2</sup><sup data-editor-footnote-reference="missing">3</sup> <span data-editor-math="inline" data-editor-tex="x^2">x^2</span></p><div data-editor-footnote-definition="note"><p>First definition</p></div><div data-editor-footnote-definition="note"><p>Second definition</p></div>`
}
