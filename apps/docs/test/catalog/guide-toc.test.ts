import { expect, test } from "bun:test"

import { guideToc } from "@/catalog/guide-toc"

test("MDX headings generate stable table-of-contents anchors", () => {
  expect(
    guideToc(
      "# Title\n\n## Set up StyleX\n\n### React Router\n\n```md\n## Not a heading\n```",
    ),
  ).toEqual([
    { title: "Set up StyleX", url: "#set-up-stylex", depth: 2 },
    { title: "React Router", url: "#react-router", depth: 3 },
  ])
})
