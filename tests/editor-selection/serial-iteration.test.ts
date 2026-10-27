import { mapSerial } from "@editor/serial-iteration"
import { expect, test } from "bun:test"

test("serial mapping is lazy and never starts the next operation before settlement", async () => {
  const calls: number[] = []
  const first = Promise.withResolvers<number>()

  const mapped = mapSerial([1, 2], function mapValue(value) {
    calls.push(value)

    return value === 1 ? first.promise : Promise.resolve(value * 10)
  })

  expect(calls).toEqual([])
  const pending = mapped.next()
  expect(calls).toEqual([1])
  first.resolve(10)
  expect(await pending).toEqual({ value: 10, done: false })
  expect(calls).toEqual([1])
  expect(await mapped.next()).toEqual({ value: 20, done: false })
  expect(await mapped.next()).toEqual({ value: undefined, done: true })
  expect(calls).toEqual([1, 2])
})

test("serial mapping stops dispatch after operation rejection", async () => {
  const calls: number[] = []
  const failure = new Error("resource rejected")

  const mapped = mapSerial([1, 2, 3], function mapValue(value) {
    calls.push(value)

    return value === 2 ? Promise.reject(failure) : Promise.resolve(value)
  })

  expect(await mapped.next()).toEqual({ value: 1, done: false })
  const result = await mapped.next().catch((cause: unknown) => cause)
  expect(result).toBe(failure)
  expect(await mapped.next()).toEqual({ value: undefined, done: true })
  expect(calls).toEqual([1, 2])
})

test("stopping a serial consumer releases the source without starting more operations", async () => {
  const calls: number[] = []
  let released = false

  function* values() {
    try {
      yield 1
      yield 2
    } finally {
      released = true
    }
  }

  for await (const value of mapSerial(values(), function mapValue(value) {
    calls.push(value)

    return Promise.resolve(value * 2)
  })) {
    expect(value).toBe(2)
    break
  }

  expect(calls).toEqual([1])
  expect(released).toBe(true)
})

test("serial mapping preserves thrown failures and synchronous values", async () => {
  const failure = new Error("cancelled")

  const mapped = mapSerial([1, 2], function mapValue(value) {
    if (value === 2) throw failure

    return value
  })

  expect(await mapped.next()).toEqual({ value: 1, done: false })
  const result = await mapped.next().catch((cause: unknown) => cause)
  expect(result).toBe(failure)
})
