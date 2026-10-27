import type { EditorDiagramMetadata } from "./diagram-model"

import {
  renderEditorDiagram,
  type EditorDiagramRenderer,
} from "./diagram-render"

const maximumConcurrentRenders = 2

const maximumQueuedRenders = 16

export interface EditorDiagramAutoRenderJob {
  readonly key: string
  readonly source: string
  readonly metadata: EditorDiagramMetadata
  readonly renderer: EditorDiagramRenderer
}

export interface EditorDiagramAutoRenderSnapshot {
  readonly busy: boolean
  readonly queued: number
  readonly rendering: number
}

interface ActiveRender {
  id: number
  job: EditorDiagramAutoRenderJob
  controller: AbortController
}

interface AutoRenderQueueOptions {
  timeoutMs: number
  nextJob(): EditorDiagramAutoRenderJob | undefined
  onStart(job: EditorDiagramAutoRenderJob): void
  onRendered(job: EditorDiagramAutoRenderJob, svg: string): void
  onError(job: EditorDiagramAutoRenderJob): void
  onSnapshot(snapshot: EditorDiagramAutoRenderSnapshot): void
}

const idleSnapshot: EditorDiagramAutoRenderSnapshot = {
  busy: false,
  queued: 0,
  rendering: 0,
}

function sameJob(
  left: EditorDiagramAutoRenderJob,
  right: EditorDiagramAutoRenderJob,
) {
  return (
    left.key === right.key &&
    left.source === right.source &&
    left.metadata.kind === right.metadata.kind
  )
}

export function createEditorDiagramAutoRenderQueue(
  options: AutoRenderQueueOptions,
) {
  const queued: EditorDiagramAutoRenderJob[] = []
  const active = new Map<number, ActiveRender>()
  const activeByKey = new Map<string, ActiveRender>()
  let nextId = 0
  let snapshot = idleSnapshot
  let pumping = false
  let pumpAgain = false

  function publish() {
    const next = {
      busy: queued.length > 0 || active.size > 0,
      queued: queued.length,
      rendering: active.size,
    }

    if (
      next.busy === snapshot.busy &&
      next.queued === snapshot.queued &&
      next.rendering === snapshot.rendering
    )
      return

    snapshot = next
    options.onSnapshot(snapshot)
  }

  function isCurrent(task: ActiveRender) {
    return (
      active.get(task.id) === task &&
      activeByKey.get(task.job.key) === task &&
      !task.controller.signal.aborted
    )
  }

  function start(job: EditorDiagramAutoRenderJob) {
    const task: ActiveRender = {
      id: ++nextId,
      job,
      controller: new AbortController(),
    }

    active.set(task.id, task)
    activeByKey.set(job.key, task)
    options.onStart(job)

    async function run() {
      let rendererSettled: Promise<void> | undefined

      try {
        const svg = await renderEditorDiagram(
          {
            diagram: job.metadata,
            source: job.source,
            signal: task.controller.signal,
            deadlineAt: Date.now() + options.timeoutMs,
          },
          (input) => {
            const pending = Promise.resolve().then(() => {
              if (input.signal.aborted)
                throw new Error("Diagram rendering was cancelled.")

              return job.renderer(input)
            })

            rendererSettled = pending.then(
              () => undefined,
              () => undefined,
            )

            return pending
          },
        )

        if (isCurrent(task)) options.onRendered(job, svg)
      } catch {
        if (isCurrent(task)) options.onError(job)
      } finally {
        if (rendererSettled) await rendererSettled
        active.delete(task.id)

        if (activeByKey.get(job.key) === task) activeByKey.delete(job.key)
        pump()
      }
    }

    void run()
  }

  function pump() {
    if (pumping) {
      pumpAgain = true

      return
    }

    pumping = true

    try {
      do {
        pumpAgain = false

        while (active.size < maximumConcurrentRenders) {
          const job = queued.shift() ?? options.nextJob()

          if (!job) break

          const current = activeByKey.get(job.key)

          if (current && sameJob(current.job, job)) continue
          start(job)
        }
      } while (pumpAgain && active.size < maximumConcurrentRenders)
    } finally {
      pumping = false
      publish()
    }
  }

  function enqueue(job: EditorDiagramAutoRenderJob) {
    const running = activeByKey.get(job.key)

    if (running) {
      if (sameJob(running.job, job)) return true
      running.controller.abort("stale")
      activeByKey.delete(job.key)
    }

    const queuedIndex = queued.findIndex((item) => item.key === job.key)

    if (queuedIndex >= 0) {
      const previous = queued[queuedIndex]

      if (previous && !sameJob(previous, job)) queued[queuedIndex] = job
      pump()

      return true
    }

    if (queued.length >= maximumQueuedRenders) return false
    queued.push(job)
    pump()

    return true
  }

  function has(job: EditorDiagramAutoRenderJob) {
    const running = activeByKey.get(job.key)

    if (running && sameJob(running.job, job)) return true

    return queued.some((item) => sameJob(item, job))
  }

  function cancel(key: string) {
    let changed = false

    for (let index = queued.length - 1; index >= 0; index -= 1) {
      if (queued[index]?.key === key) {
        queued.splice(index, 1)
        changed = true
      }
    }

    const running = activeByKey.get(key)

    if (running) {
      running.controller.abort("stale")
      activeByKey.delete(key)
      changed = true
    }

    if (changed) {
      pump()
      publish()
    }
  }

  function cancelAll() {
    queued.length = 0

    for (const task of activeByKey.values()) task.controller.abort("stale")

    activeByKey.clear()
    publish()
  }

  return {
    cancel,
    cancelAll,
    enqueue,
    getSnapshot(this: void) {
      return snapshot
    },
    has,
    wake: pump,
  }
}
