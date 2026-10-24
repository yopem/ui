import { buildEditorFromExtensions } from "@lexical/extension"
import { createEditorReview } from "@yopem-ui/editor/review-extension"
import { expect, test } from "bun:test"
import { $createParagraphNode, $createTextNode, $getRoot } from "lexical"

test("duplicate extension builds keep identity, disposal, and native context separate", () => {
  const scope = createEditorReview()
  const first = buildEditorFromExtensions(scope.extension)
  const second = buildEditorFromExtensions(scope.extension)
  const alice = scope.forEditor(first)
  const bob = scope.forEditor(second)
  alice.setHost({
    viewer: { id: "alice", name: "Alice" },
    visible: true,
    replyWhileReadonly: false,
    can: () => true,
  })
  bob.setHost({
    viewer: { id: "bob", name: "Bob" },
    visible: true,
    replyWhileReadonly: false,
    can: () => true,
  })

  for (const editor of [first, second])
    editor.update(
      () => {
        const text = $createTextNode("Original")
        $getRoot().clear().append($createParagraphNode().append(text))
        text.selectEnd()
      },
      { discrete: true },
    )
  expect(
    alice.run(() => {
      alice.$suggestInsert(" A")
    }),
  ).toBe(true)
  expect(
    bob.run(() => {
      alice.$suggestInsert(" Cross-document")
    }),
  ).toBe(false)
  second.read(() => expect($getRoot().getTextContent()).toBe("Original"))
  expect(
    bob.run(() => {
      bob.$suggestInsert(" B")
    }),
  ).toBe(true)
  expect(alice.getView().suggestions[0].author.id).toBe("alice")
  expect(bob.getView().suggestions[0].author.id).toBe("bob")
  first.dispose()
  expect(() => scope.forEditor(first)).toThrow()
  expect(
    alice.run(() => {
      alice.$suggestInsert(" Expired")
    }),
  ).toBe(false)
  expect(
    bob.run(() => {
      bob.$suggestInsert(" Alive")
    }),
  ).toBe(true)
  second.read(() =>
    expect($getRoot().getTextContent()).toBe("Original B Alive"),
  )
  second.dispose()
})
