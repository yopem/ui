import type { AuthenticationResult } from "@editor/server/auth"

import { createAssetHttpHandler } from "@editor/server/asset-http"
import { expect, test } from "bun:test"
import { readFile } from "node:fs/promises"
import { z } from "zod"

import { browserPng, createBrowserFixture } from "./browser-fixture"

test("read metadata admission, identity, policy, ranges and unchanged mutation CSRF", async function security() {
  const tls = process.env.ASSET_BROWSER_TLS_DIR

  if (!tls) throw new Error("Set ASSET_BROWSER_TLS_DIR")

  const fixture = await createBrowserFixture(
    await readFile(`${tls}/key.pem`, "utf8"),
    await readFile(`${tls}/cert.pem`, "utf8"),
  )

  try {
    const config = fixture.config

    const authenticate = function authenticate() {
      return Promise.resolve<AuthenticationResult>({
        status: "authenticated",
        identity: { provider: "openauth", userId: "fixture-user" },
        credentialExpiresAt: Date.now() + 60000,
      })
    }

    config.authenticate = authenticate
    const service = createAssetHttpHandler(config)

    const mutation = {
      Origin: fixture.origin,
      "X-Editor-Request": "1",
      "X-CSRF-Token": "fixture",
      "Content-Type": "image/png",
    }

    const upload = await service.handle(
      new Request(`${fixture.origin}/editor/documents/tenant:browser/assets`, {
        method: "POST",
        headers: mutation,
        body: browserPng,
      }),
    )

    expect(upload.status).toBe(201)
    const asset = z.object({ url: z.string() }).parse(await upload.json())
    const url = `${fixture.origin}${asset.url}`

    const fetchMetadata = {
      "Sec-Fetch-Site": "same-origin",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Dest": "empty",
    }

    const imageMetadata = {
      "Sec-Fetch-Site": "same-origin",
      "Sec-Fetch-Mode": "no-cors",
      "Sec-Fetch-Dest": "image",
    }

    const navigateMetadata = {
      "Sec-Fetch-Site": "same-origin",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-User": "?1",
    }

    for (const headers of [
      fetchMetadata,
      { ...fetchMetadata, "Sec-Fetch-Mode": "same-origin" },
      imageMetadata,
      navigateMetadata,
      {
        "Sec-Fetch-Site": "same-origin",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Dest": "empty",
        Referer: `${fixture.origin}/`,
      },
    ]) {
      const response = await service.handle(new Request(url, { headers }))
      expect(response.status).toBe(200)
      expect(response.headers.has("Access-Control-Allow-Origin")).toBe(false)
      expect(Buffer.from(await response.arrayBuffer())).toEqual(browserPng)
    }

    const rejected: Record<string, string>[] = [
      {},
      { ...fetchMetadata, Origin: "null" },
      { ...fetchMetadata, Origin: "" },
      ...["cross-site", "same-site", "none", ""].map((site) => ({
        ...fetchMetadata,
        "Sec-Fetch-Site": site,
      })),
      { "Sec-Fetch-Site": "same-origin" },
      { "Sec-Fetch-Mode": "cors", "Sec-Fetch-Dest": "empty" },
      { ...fetchMetadata, "Sec-Fetch-Mode": "no-cors" },
      { ...fetchMetadata, "Sec-Fetch-Dest": "script" },
      { ...imageMetadata, "Sec-Fetch-Dest": "iframe" },
      { ...navigateMetadata, "Sec-Fetch-User": "" },
      { ...navigateMetadata, "Sec-Fetch-Dest": "iframe" },
      {
        "Sec-Fetch-Site": "same-origin",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Dest": "empty",
      },
      { ...fetchMetadata, "Sec-Fetch-User": "?1" },
      { ...imageMetadata, "Sec-Fetch-User": "?1" },
      { ...navigateMetadata, "Sec-Fetch-User": "?0" },
      { ...fetchMetadata, Origin: `${fixture.origin}.evil` },
      { ...fetchMetadata, Origin: "https://sibling.example" },
      { ...fetchMetadata, Referer: "https://sibling.example/page" },
    ]

    for (const headers of rejected)
      expect((await service.handle(new Request(url, { headers }))).status).toBe(
        403,
      )

    for (const other of [
      url.replace("https:", "http:"),
      url.replace("127.0.0.1", "localhost"),
    ])
      expect(
        (await service.handle(new Request(other, { headers: fetchMetadata })))
          .status,
      ).toBe(403)

    const explicit = await service.handle(
      new Request(url, { headers: { Origin: fixture.origin } }),
    )

    expect(explicit.status).toBe(200)
    expect(explicit.headers.get("Access-Control-Allow-Origin")).toBe(
      fixture.origin,
    )
    expect(
      (
        await service.handle(
          new Request(`${url}?token=forbidden`, { headers: fetchMetadata }),
        )
      ).status,
    ).toBe(400)

    for (const method of ["POST", "DELETE", "OPTIONS"])
      expect(
        (
          await service.handle(
            new Request(
              method === "POST"
                ? `${fixture.origin}/editor/documents/tenant:browser/assets`
                : url,
              { method, headers: fetchMetadata },
            ),
          )
        ).status,
      ).toBe(403)

    for (const missing of ["Origin", "X-Editor-Request", "X-CSRF-Token"]) {
      const headers = new Headers({ ...mutation, ...fetchMetadata })
      headers.delete(missing)

      for (const method of ["POST", "DELETE"])
        expect(
          (
            await service.handle(
              new Request(
                method === "POST"
                  ? `${fixture.origin}/editor/documents/tenant:browser/assets`
                  : url,
                {
                  method,
                  headers,
                  body: method === "POST" ? browserPng : undefined,
                },
              ),
            )
          ).status,
        ).toBe(403)
    }

    for (const result of [
      { status: "unauthenticated" },
      {
        status: "authenticated",
        identity: { provider: "openauth", userId: "" },
        credentialExpiresAt: Date.now() + 60000,
      },
      {
        status: "authenticated",
        identity: { provider: "openauth", userId: "fixture-user" },
      },
      ...[0, Date.now() - 1, NaN, Infinity].map((expiry) => ({
        status: "authenticated" as const,
        identity: { provider: "openauth" as const, userId: "fixture-user" },
        credentialExpiresAt: expiry,
      })),
    ] satisfies AuthenticationResult[]) {
      config.authenticate = function invalid() {
        return Promise.resolve(result)
      }

      expect(
        (await service.handle(new Request(url, { headers: imageMetadata })))
          .status,
      ).toBe(401)
    }

    config.authenticate = authenticate

    for (const policy of ["document-deny", "asset-deny"] as const) {
      fixture.setPolicy(policy)
      expect(
        (await service.handle(new Request(url, { headers: fetchMetadata })))
          .status,
      ).toBe(403)
    }

    fixture.setPolicy("allow")
    const policy = config.policy
    config.authenticate = function shortExpiry() {
      return Promise.resolve({
        status: "authenticated",
        identity: { provider: "openauth", userId: "fixture-user" },
        credentialExpiresAt: Date.now() + 50,
      })
    }

    config.policy = async function delayed() {
      await Bun.sleep(80)

      return true
    }

    expect([401, 503]).toContain(
      (await service.handle(new Request(url, { headers: fetchMetadata })))
        .status,
    )
    config.authenticate = authenticate
    config.policy = policy

    for (const range of ["bytes=0-1", "bytes=-3", "bytes=2-"])
      expect(
        (
          await service.handle(
            new Request(url, { headers: { ...fetchMetadata, Range: range } }),
          )
        ).status,
      ).toBe(206)

    for (const range of ["bytes=999-", "bytes=0-1,3-4", "bytes=-0"])
      expect(
        (
          await service.handle(
            new Request(url, { headers: { ...fetchMetadata, Range: range } }),
          )
        ).status,
      ).toBe(416)
    expect(
      (
        await service.handle(
          new Request(url, { method: "DELETE", headers: mutation }),
        )
      ).status,
    ).toBe(204)
    expect(
      (await service.handle(new Request(url, { headers: imageMetadata })))
        .status,
    ).toBe(404)
  } finally {
    await fixture.close()
  }
}, 60000)
