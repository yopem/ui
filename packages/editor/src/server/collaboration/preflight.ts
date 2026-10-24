import { CollaborationError, collaborationLimits } from "./protocol"

function scanUpdate(bytes: Uint8Array) {
  if (bytes.length < 2 || bytes.length > collaborationLimits.stateBytes)
    throw new Error("update budget")
  let position = 0
  let values = 0
  let types = 0
  let structs = 0
  let logicalLength = 0

  function byte() {
    const value = bytes[position++]

    if (value === undefined) throw new Error("truncated update")

    return value
  }

  function uint(maximum = 4294967295) {
    let result = 0
    let factor = 1

    for (let index = 0; index < 5; index++) {
      const value = byte()
      result += (value & 127) * factor

      if (result > maximum) throw new Error("integer budget")

      if (value < 128) return result
      factor *= 128
    }

    throw new Error("integer budget")
  }

  function skip(length: number) {
    if (length > bytes.length - position) throw new Error("truncated update")
    position += length
  }

  function string() {
    const length = uint(collaborationLimits.stateBytes)
    skip(length)

    return length
  }

  function json() {
    const length = uint(collaborationLimits.stateBytes)
    const end = position + length

    if (end > bytes.length) throw new Error("truncated JSON")
    let depth = 0
    let quoted = false
    let escaped = false

    if (++values > 2048) throw new Error("JSON budget")

    while (position < end) {
      const character = byte()

      if (quoted) {
        if (escaped) escaped = false
        else if (character === 92) escaped = true
        else if (character === 34) quoted = false
      } else if (character === 34) quoted = true
      else if (character === 123 || character === 91) {
        depth++
        values++
      } else if (character === 125 || character === 93) depth--
      else if (character === 44 || character === 58) values++

      if (depth < 0 || depth > 16 || values > 2048)
        throw new Error("JSON budget")
    }

    if (quoted || depth !== 0) throw new Error("invalid JSON")
  }

  function id() {
    uint()
    uint(collaborationLimits.logicalLength)
  }

  function value(depth = 0) {
    if (++values > 2048 || depth > 16) throw new Error("value budget")
    const tag = byte()

    switch (tag) {
      case 127:
      case 126:
      case 121:
      case 120:
        return
      case 125: {
        const first = byte()

        if (first < 128) return

        for (let index = 0; index < 7; index++) if (byte() < 128) return
        throw new Error("integer budget")
      }

      case 124:
        skip(4)

        return
      case 123:
      case 122:
        skip(8)

        return
      case 119:
      case 116:
        string()

        return
      case 118:
      case 117: {
        const count = uint(2048 - values)

        for (let index = 0; index < count; index++) {
          if (tag === 118) string()
          value(depth + 1)
        }

        return
      }

      default:
        throw new Error("content type")
    }
  }

  const clients = uint(collaborationLimits.clients)
  const seen = new Set<number>()

  for (let client = 0; client < clients; client++) {
    const count = uint(collaborationLimits.structs - structs)
    structs += count
    const clientId = uint()

    if (seen.has(clientId)) throw new Error("duplicate client")
    seen.add(clientId)
    let clock = uint(collaborationLimits.logicalLength)

    for (let index = 0; index < count; index++) {
      const info = byte()
      const content = info & 31
      let length = 1

      if (content === 0) {
        if (info !== 0) throw new Error("invalid GC")
        length = uint(collaborationLimits.logicalLength)
      } else {
        if (info & 128) id()

        if (info & 64) id()

        if (!(info & 192)) {
          const parent = uint(1)

          if (parent === 1) string()
          else id()

          if (info & 32) string()
        }

        switch (content) {
          case 1:
            length = uint(collaborationLimits.logicalLength)
            break
          case 3:
            string()
            break
          case 4: {
            const byteLength = string()
            length = new TextDecoder("utf-8", {
              fatal: true,
              ignoreBOM: true,
            }).decode(bytes.subarray(position - byteLength, position)).length
            break
          }

          case 5:
            json()
            break
          case 6:
            string()
            json()
            break
          case 7: {
            if (++types > 32) throw new Error("shared type budget")
            const type = uint(6)

            if (type === 3 || type === 5) string()
            break
          }

          case 8:
            length = uint(2048 - values)

            for (let item = 0; item < length; item++) value()
            break
          case 9:
            throw new CollaborationError("subdocument")
          default:
            throw new Error("unsupported V1 content")
        }
      }

      if (length === 0) throw new Error("empty struct")
      logicalLength += length
      clock += length

      if (
        logicalLength > collaborationLimits.logicalLength ||
        clock > collaborationLimits.logicalLength
      )
        throw new Error("logical budget")
    }
  }

  const deletes = uint(collaborationLimits.clients)
  let ranges = 0
  const deletedClients = new Set<number>()

  for (let index = 0; index < deletes; index++) {
    const clientId = uint()

    if (deletedClients.has(clientId)) throw new Error("duplicate deletes")
    deletedClients.add(clientId)
    const count = uint(collaborationLimits.structs - ranges)
    ranges += count

    for (let range = 0; range < count; range++) {
      const clock = uint(collaborationLimits.logicalLength)
      const length = uint(collaborationLimits.logicalLength)

      if (length === 0 || clock + length > collaborationLimits.logicalLength)
        throw new Error("delete budget")
    }
  }

  if (position !== bytes.length) throw new Error("trailing update")
}

export function preflightUpdate(bytes: Uint8Array) {
  try {
    scanUpdate(bytes)
  } catch (error) {
    if (error instanceof CollaborationError) throw error
    throw new CollaborationError("invalid")
  }
}
