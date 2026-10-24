import {
  parseEditorReview,
  parseEditorReviewJSON,
  reviewMarkdown,
  reviewHTML,
} from "@yopem-ui/editor/review-codecs"
import {
  createReviewSession,
  type EditorReviewHost,
} from "@yopem-ui/editor/review-model"
import { describe, expect, test } from "bun:test"

interface CyclicFixture {
  self?: object
}

interface DeepFixture {
  child: object | null
}

const author = { id: "alice", name: "Alice" }

function fixture() {
  return {
    version: 1,
    threads: [
      {
        id: "thread-1",
        resolved: false,
        comments: [
          {
            id: "comment-1",
            author: { ...author },
            text: "Review <this>",
            createdAt: 1,
            updatedAt: 1,
          },
        ],
      },
    ],
  }
}

describe("portable review boundary", () => {
  test("shared JSON references are not treated as cycles", () => {
    const value = fixture()
    const comment = value.threads[0].comments[0]
    value.threads[0].comments.push({ ...comment, id: "comment-2" })
    expect(parseEditorReview(value).threads[0].comments).toHaveLength(2)
  })

  test("parsed review metadata is immutable across consumers", () => {
    const value = parseEditorReview(fixture())
    expect(Object.isFrozen(value)).toBe(true)
    expect(Object.isFrozen(value.threads)).toBe(true)
    expect(Object.isFrozen(value.threads[0].comments)).toBe(true)
    expect(Object.isFrozen(value.threads[0].comments[0].author)).toBe(true)
  })

  test("round trips stable IDs and escapes output", () => {
    const value = parseEditorReview(fixture())
    expect(parseEditorReviewJSON(JSON.stringify(value))).toEqual(value)
    expect(reviewHTML(value)).toContain("&lt;this&gt;")
    expect(reviewHTML(value)).not.toContain("Review <this>")
    expect(reviewMarkdown(value)).toContain("thread-1")
  })

  test("rejects forged shapes and collection growth", () => {
    expect(() => parseEditorReview({ ...fixture(), version: 2 })).toThrow()
    const value = fixture()
    value.threads[0].comments[0].author.id = ""
    expect(() => parseEditorReview(value)).toThrow()
    expect(() =>
      parseEditorReview({
        version: 1,
        threads: Array(257).fill(fixture().threads[0]),
      }),
    ).toThrow()
    expect(() =>
      parseEditorReview({
        version: 1,
        threads: [fixture().threads[0], fixture().threads[0]],
      }),
    ).toThrow()
    const large = fixture()
    large.threads[0].comments[0].text = "x".repeat(16385)
    expect(() => parseEditorReview(large)).toThrow()
    const badTime = fixture()
    badTime.threads[0].comments[0].createdAt = Infinity
    expect(() => parseEditorReview(badTime)).toThrow()
  })

  test("rejects cycles and deep objects before schema traversal", () => {
    const cyclic: CyclicFixture = {}
    cyclic.self = cyclic
    expect(() => parseEditorReview(cyclic)).toThrow()
    let deep: DeepFixture = { child: null }

    for (let i = 0; i < 40; i++) deep = { child: deep }
    expect(() => parseEditorReview(deep)).toThrow()
  })
})

describe("host authorization lifetime", () => {
  test("host identity changes require explicit replacement", () => {
    const session = createReviewSession()

    const host = {
      viewer: { id: "alice", name: "Alice" },
      can: () => true,
      visible: true,
      replyWhileReadonly: false,
    }

    session.replace(host)
    host.viewer.id = "mallory"
    expect(session.authorize("reply", "thread-1").author.id).toBe("alice")
    session.replace(host)
    expect(session.authorize("reply", "thread-1").author.id).toBe("mallory")
  })

  test("invalid replacement clears the old host and its issued permissions", () => {
    const session = createReviewSession()
    session.replace({
      viewer: author,
      can: () => true,
      visible: true,
      replyWhileReadonly: true,
    })
    const permit = session.authorize("reply", "thread-1")
    expect(() =>
      session.replace({
        viewer: { id: "", name: "Invalid" },
        can: () => true,
        visible: true,
        replyWhileReadonly: true,
      }),
    ).toThrow()
    expect(() => session.authorize("reply", "thread-1")).toThrow()
    expect(permit.assertCurrent).toThrow()

    const invalid = {
      viewer: author,
      can: () => true,
      visible: true,
      replyWhileReadonly: false,
    }

    Reflect.set(invalid, "replyWhileReadonly", "false")
    expect(() => session.replace(invalid)).toThrow()
    expect(() => session.authorize("reply", "thread-1")).toThrow()
  })

  test("no viewer and denied policies cannot mutate", () => {
    const session = createReviewSession()
    expect(() => session.authorize("reply", "thread-1")).toThrow()
    session.replace({
      viewer: author,
      can: () => false,
      visible: true,
      replyWhileReadonly: false,
    })
    expect(() => session.authorize("reply", "thread-1")).toThrow()
    session.replace({
      viewer: author,
      can: () => {
        throw new Error("host failure")
      },
      visible: true,
      replyWhileReadonly: false,
    })
    expect(() => session.authorize("reply", "thread-1")).toThrow("host failure")
  })

  test("reentrant host replacement and disposal invalidate authorization", () => {
    const session = createReviewSession()
    session.replace({
      viewer: author,
      can: () => {
        session.replace(null)

        return true
      },
      visible: true,
      replyWhileReadonly: false,
    })
    expect(() => session.authorize("reply", "thread-1")).toThrow()
    session.replace({
      viewer: author,
      can: () => true,
      visible: true,
      replyWhileReadonly: true,
    })
    const permit = session.authorize("reply", "thread-1")
    expect(permit.author).toEqual(author)
    session.replace(null)
    expect(() => permit.assertCurrent()).toThrow()
    session.dispose()
    expect(() => session.authorize("create")).toThrow()
  })

  test("serialized attribution never supplies viewer", () => {
    const value = parseEditorReview(fixture())
    expect(value.threads[0].comments[0].author.id).toBe("alice")
    expect(() =>
      createReviewSession().authorize("delete", "comment-1"),
    ).toThrow()
  })
})

test("callable host policies do not depend on the local Function prototype", () => {
  const session = createReviewSession()
  const can: EditorReviewHost["can"] = () => true
  Object.setPrototypeOf(can, null)
  session.replace({
    viewer: author,
    visible: true,
    replyWhileReadonly: false,
    can,
  })
  expect(session.authorize("reply", "thread-1").author).toEqual(author)
})

test("unknown runtime actions never reach the host policy", () => {
  const session = createReviewSession()
  let calls = 0
  session.replace({
    viewer: { id: "alice", name: "Alice" },
    visible: true,
    replyWhileReadonly: false,
    can() {
      calls++

      return true
    },
  })
  expect(() => session.authorize("root-admin")).toThrow()
  expect(calls).toBe(0)
})
