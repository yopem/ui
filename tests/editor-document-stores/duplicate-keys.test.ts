import type {
  DocumentConfig,
  DocumentContext,
  DocumentDriver,
  DocumentMutation,
} from "@editor/server/document-model"

import { createEditorCollaborationInitializer } from "@editor/server/collaboration-initialize"
import { createDocumentHttpHandler } from "@editor/server/document-http"
import { boundedState } from "@editor/server/document-model"
import { createDocumentService } from "@editor/server/document-service"
import { expect, test } from "bun:test"

async function rejection(work: Promise<unknown>) {
  try {
    await work
  } catch (error) {
    if (error instanceof Error) return error
    throw new Error("Non-error rejection")
  }

  throw new Error("Expected rejection")
}

const good =
  '{"root":{"type":"root","children":[]},"a":{"x":1},"b":{"x":2},"text":"{\\"x\\":1}"}'

const duplicates = [
  '{"root":null,"root":{"type":"root","children":[]}}',
  '{"root":{"type":"root","t\\u0079pe":"root","children":[]}}',
  '{"root":{"type":"root","children":[{"meta":[{"x":1,"\\u0078":2}]}]}}',
]

const generation = "a".repeat(64)

const etag = `"${generation}:1"`

function context(): DocumentContext {
  return {
    identity: { provider: "openauth", userId: "user" },
    signal: new AbortController().signal,
    deadline: Date.now() + 10000,
  }
}

function configuration(
  validateState: DocumentConfig["validateState"] = () => true,
): DocumentConfig {
  return {
    policy: () => Promise.resolve(true),
    validateState,
    timeoutMs: 5000,
    maxConcurrent: 2,
  }
}

function mutation(state: string): DocumentMutation {
  return {
    documentId: "app:test",
    operationId: "operation12345678",
    expected: { kind: "etag", etag },
    change: { kind: "save", schemaVersion: 1, state },
  }
}

function row(state: string) {
  return {
    document_id: "app:test",
    generation,
    revision: "1",
    mode: "snapshot",
    state_json: state,
    schema_version: 1,
    deleted: 0,
  }
}

function request(body: string) {
  return new Request("https://editor.example/documents/app:test", {
    method: "PUT",
    headers: {
      origin: "https://editor.example",
      "x-csrf-token": "token",
      "content-type": "application/json",
      "if-match": etag,
      "idempotency-key": "operation12345678",
    },
    body,
  })
}

function httpOptions(service: ReturnType<typeof createDocumentService>) {
  return {
    origin: "https://editor.example",
    basePath: "/documents/",
    timeoutMs: 5000,
    maxConcurrent: 2,
    service,
    authenticate: function authenticate() {
      return Promise.resolve({
        status: "authenticated",
        identity: { provider: "openauth", userId: "user" },
      } as const)
    },
    policy: function policy() {
      return true
    },
    verifyCsrf: function verifyCsrf() {
      return true
    },
  }
}

test("raw saves reject duplicate keys before validation or persistence", async () => {
  let reads = 0
  let writes = 0
  let validations = 0
  const stored = row(good)

  const driver: DocumentDriver = {
    read() {
      reads++

      return Promise.resolve([stored])
    },
    mutate() {
      writes++

      return Promise.resolve({ receipt: [], head: [] })
    },
  }

  const service = createDocumentService(
    driver,
    configuration(() => {
      validations++

      return true
    }),
  )

  for (const raw of duplicates) {
    const original = raw
    expect(
      await rejection(service.mutate(mutation(raw), context())),
    ).toMatchObject({ code: "invalid" })
    expect(raw).toBe(original)
    expect(stored.state_json).toBe(good)
  }

  expect([reads, writes, validations]).toEqual([0, 0, 0])
  expect(boundedState(good, 1, () => true)).toEqual(JSON.parse(good))
})

test("legacy duplicate rows fail closed for read, save and delete without changing stored bytes", async () => {
  for (const raw of duplicates) {
    const stored = row(raw)
    let writes = 0
    let validations = 0

    const service = createDocumentService(
      {
        read() {
          return Promise.resolve([stored])
        },
        mutate() {
          writes++

          return Promise.resolve({ receipt: [], head: [] })
        },
      },
      configuration(() => {
        validations++

        return true
      }),
    )

    expect(await rejection(service.read("app:test", context()))).toMatchObject({
      code: "corrupt",
    })
    expect(validations).toBe(0)
    expect(
      await rejection(service.mutate(mutation(good), context())),
    ).toMatchObject({ code: "corrupt" })
    expect(validations).toBe(1)
    expect(
      await rejection(
        service.mutate(
          { ...mutation(good), change: { kind: "delete" } },
          context(),
        ),
      ),
    ).toMatchObject({ code: "corrupt" })
    expect(validations).toBe(1)
    expect(writes).toBe(0)
    expect(stored.state_json).toBe(raw)
  }
})

test("HTTP rejects duplicate envelope and state fields before dispatch, after host checks", async () => {
  const stored = row(good)
  let writes = 0
  let validations = 0
  const steps: string[] = []

  const service = createDocumentService(
    {
      read() {
        return Promise.resolve([stored])
      },
      mutate() {
        writes++

        return Promise.resolve({ receipt: [], head: [] })
      },
    },
    configuration(() => {
      validations++

      return true
    }),
  )

  const base = httpOptions(service)

  const handler = createDocumentHttpHandler({
    ...base,
    authenticate: function authenticate() {
      steps.push("auth")

      return base.authenticate()
    },
    policy: function policy() {
      steps.push("policy")

      return true
    },
    verifyCsrf: function verifyCsrf() {
      steps.push("csrf")

      return true
    },
  })

  const inputs = [
    ...duplicates.map((state) => `{"schemaVersion":1,"state":${state}}`),
    `{"schemaVersion":1,"schemaVersion":1,"state":${good}}`,
    `{"schemaVersion":1,"state":${good},"st\\u0061te":${good}}`,
    `{"schemaVersion":1,"state":${good},"extra":{"x":1,"x":2}}`,
  ]

  for (const body of inputs) {
    expect((await handler(request(body))).status).toBe(400)
    expect(stored.state_json).toBe(good)
  }

  expect(steps).toEqual(inputs.flatMap(() => ["auth", "policy", "csrf"]))
  expect([writes, validations]).toEqual([0, 0])
  expect(
    (await handler(request(`{"schemaVersion":1,"state":${good}}`))).status,
  ).toBe(412)
  expect(writes).toBe(1)

  const deniedPolicy = createDocumentHttpHandler({
    ...base,
    policy: () => false,
  })

  expect((await deniedPolicy(request(inputs[0]))).status).toBe(403)
  const denied = createDocumentHttpHandler({ ...base, verifyCsrf: () => false })
  expect((await denied(request(inputs[0]))).status).toBe(403)

  const unauthenticated = createDocumentHttpHandler({
    ...base,
    authenticate: () => Promise.resolve({ status: "unauthenticated" as const }),
  })

  expect((await unauthenticated(request(inputs[0]))).status).toBe(401)
})

test("valid saves retain canonical bytes and stable digest", async () => {
  const prepared: { state: string | null; digest: string }[] = []

  const service = createDocumentService(
    {
      read() {
        return Promise.resolve([row(good)])
      },
      mutate(input) {
        prepared.push({ state: input.state, digest: input.digest })

        return Promise.resolve({ receipt: [], head: [] })
      },
    },
    configuration(),
  )

  await service.mutate(mutation(good), context())
  await service.mutate(
    mutation(JSON.stringify(JSON.parse(good), null, 2)),
    context(),
  )
  expect(prepared).toHaveLength(2)
  expect(prepared[0]).toEqual(prepared[1])
  expect(prepared[0]?.digest).toMatch(/^[0-9a-f]{64}$/)
  expect(JSON.parse(prepared[0]?.state ?? "null")).toEqual(JSON.parse(good))
})

test("collaboration rejects duplicates before validation and editor creation", async () => {
  let validations = 0
  let editors = 0

  const initialize = createEditorCollaborationInitializer({
    validateState() {
      validations++

      return true
    },
    createEditor() {
      editors++
      throw new Error("must not create editor")
    },
  })

  for (const state of duplicates) {
    expect(
      await rejection(
        initialize({
          state,
          schemaVersion: 1,
          signal: new AbortController().signal,
        }),
      ),
    ).toMatchObject({ code: "invalid" })
  }

  expect([validations, editors]).toEqual([0, 0])
  const signal = AbortSignal.abort()
  expect(
    await rejection(
      initialize({ state: duplicates[0], schemaVersion: 1, signal }),
    ),
  ).toMatchObject({ code: "aborted" })
})

test("existing invalid syntax and resource limits remain enforced", () => {
  for (const raw of [
    "{",
    '{"root":{},}',
    `{"root":{"type":"root","children":[]},"s":"${"x".repeat(1048576)}"}`,
  ])
    expect(() => boundedState(raw, 1, () => true)).toThrow(
      expect.objectContaining({ code: "invalid" }),
    )

  const nested = (count: number) =>
    '{"root":{"type":"root","children":[]},"n":' +
    "[".repeat(count) +
    "0" +
    "]".repeat(count) +
    "}"

  expect(() => boundedState(nested(63), 1, () => true)).not.toThrow()
  expect(() => boundedState(nested(64), 1, () => true)).toThrow(
    expect.objectContaining({ code: "budget" }),
  )

  const wide = JSON.stringify({
    root: {
      type: "root",
      children: Array.from({ length: 131072 }, () => null),
    },
  })

  expect(() => boundedState(wide, 1, () => true)).toThrow(
    expect.objectContaining({ code: "budget" }),
  )
})
