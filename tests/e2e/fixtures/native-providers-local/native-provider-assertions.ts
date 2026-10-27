import type { Page } from "@playwright/test"

import { z } from "zod"

interface NativeRtcConnection {
  peerConnection: RTCPeerConnection
  channels: Set<RTCDataChannel>
}

interface NativeRtcProbe {
  connections: NativeRtcConnection[]
}

declare global {
  interface Window {
    __nativeProviderRtcProbe?: NativeRtcProbe
  }
}

const dataChannelStatSchema = z.object({
  type: z.literal("data-channel"),
  bytesSent: z.number().nonnegative(),
  bytesReceived: z.number().nonnegative(),
})

const nativeGrantResponseSchema = z.object({
  permission: z.enum(["read", "write"]),
  peer: z.null(),
})

export interface NativeRtcEvidence {
  peerConnections: number
  connectedPeerConnections: number
  openDataChannels: number
  dataChannelStats: number
  bytesSent: number
  bytesReceived: number
}

export interface HocuspocusTrafficGate {
  block(): void
  release(): void
  isBlocking(): boolean
  suppressedClientMessages(): number
}

export interface NativeGrantEvidence {
  status: number
  permission: string | undefined
  peerIsNull: boolean
}

export function installNativeRtcProbe() {
  if (window.__nativeProviderRtcProbe) return

  const NativeRTCPeerConnection = window.RTCPeerConnection
  const connections: NativeRtcConnection[] = []

  function recordChannel(
    connection: NativeRtcConnection,
    channel: RTCDataChannel,
  ) {
    connection.channels.add(channel)
  }

  class FixtureRTCPeerConnection extends NativeRTCPeerConnection {
    private readonly fixtureConnection: NativeRtcConnection

    constructor(configuration?: RTCConfiguration) {
      super({
        ...configuration,
        iceServers: [],
        iceTransportPolicy: "all",
      })

      this.fixtureConnection = {
        peerConnection: this,
        channels: new Set(),
      }
      connections.push(this.fixtureConnection)
      this.addEventListener("datachannel", (event) =>
        recordChannel(this.fixtureConnection, event.channel),
      )
    }

    override createDataChannel(
      label: string,
      dataChannelDict?: RTCDataChannelInit,
    ) {
      const channel = super.createDataChannel(label, dataChannelDict)
      recordChannel(this.fixtureConnection, channel)

      return channel
    }
  }

  Object.defineProperty(window, "RTCPeerConnection", {
    configurable: true,
    value: FixtureRTCPeerConnection,
    writable: true,
  })
  window.__nativeProviderRtcProbe = { connections }
}

export async function readNativeRtcEvidence(
  page: Page,
): Promise<NativeRtcEvidence> {
  const snapshot = await page.evaluate(
    async (): Promise<{
      peerConnections: number
      connectedPeerConnections: number
      openDataChannels: number
      stats: unknown[]
    }> => {
      const connections = window.__nativeProviderRtcProbe?.connections ?? []
      let connectedPeerConnections = 0
      let openDataChannels = 0
      const stats: unknown[] = []

      for (const connection of connections) {
        const peerConnection = connection.peerConnection

        const openChannels = [...connection.channels].filter(
          (channel) => channel.readyState === "open",
        ).length

        if (
          peerConnection.connectionState !== "connected" ||
          !["connected", "completed"].includes(
            peerConnection.iceConnectionState,
          ) ||
          openChannels === 0
        )
          continue

        connectedPeerConnections++
        openDataChannels += openChannels

        const report = await peerConnection.getStats()

        for (const stat of report.values()) stats.push(stat)
      }

      return {
        peerConnections: connections.length,
        connectedPeerConnections,
        openDataChannels,
        stats,
      }
    },
  )

  const dataChannelStats = snapshot.stats.flatMap((stat) => {
    const parsed = dataChannelStatSchema.safeParse(stat)

    return parsed.success ? [parsed.data] : []
  })

  return {
    peerConnections: snapshot.peerConnections,
    connectedPeerConnections: snapshot.connectedPeerConnections,
    openDataChannels: snapshot.openDataChannels,
    dataChannelStats: dataChannelStats.length,
    bytesSent: dataChannelStats.reduce(
      (total, stat) => total + stat.bytesSent,
      0,
    ),
    bytesReceived: dataChannelStats.reduce(
      (total, stat) => total + stat.bytesReceived,
      0,
    ),
  }
}

export async function installHocuspocusTrafficGate(
  page: Page,
  socketUrl: string,
): Promise<HocuspocusTrafficGate> {
  const socketEndpoint = new URL(socketUrl)
  let blocking = false
  let suppressedClientMessages = 0
  let queuedBytes = 0
  const pendingMessages: (() => void)[] = []

  await page.routeWebSocket(
    (url) =>
      url.origin === socketEndpoint.origin &&
      url.pathname === socketEndpoint.pathname,
    (route) => {
      const server = route.connectToServer()

      route.onMessage((message) => {
        if (blocking) {
          const byteLength = Buffer.byteLength(message)

          if (
            pendingMessages.length >= 256 ||
            queuedBytes + byteLength > 1_048_576
          ) {
            throw new Error(
              "Native provider traffic gate exceeded its queue limit",
            )
          }

          suppressedClientMessages++
          queuedBytes += byteLength
          pendingMessages.push(() => server.send(message))

          return
        }

        server.send(message)
      })
    },
  )

  return {
    block() {
      blocking = true
    },
    release() {
      blocking = false
      queuedBytes = 0

      for (const send of pendingMessages.splice(0)) send()
    },
    isBlocking() {
      return blocking
    },
    suppressedClientMessages() {
      return suppressedClientMessages
    },
  }
}

export function watchNativeGrantResponse(
  page: Page,
  grantUrl: string,
): Promise<NativeGrantEvidence> {
  const endpoint = new URL(grantUrl)

  return page
    .waitForResponse((response) => {
      const actual = new URL(response.url())

      return (
        response.request().method() === "POST" &&
        actual.origin === endpoint.origin &&
        actual.pathname === endpoint.pathname
      )
    })
    .then(async (response) => {
      try {
        const body: unknown = await response.json()
        const parsed = nativeGrantResponseSchema.safeParse(body)

        return {
          status: response.status(),
          permission: parsed.success ? parsed.data.permission : undefined,
          peerIsNull: parsed.success,
        }
      } catch {
        return {
          status: response.status(),
          permission: undefined,
          peerIsNull: false,
        }
      }
    })
}
