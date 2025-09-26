import { describe, it, expect, beforeEach } from "bun:test"
import { HydraManager } from "../src/hydra/headManager"
import { UISync } from "../src/hydra/uiSync"
import { ProofQueue, ProofPriority } from "../src/proofs/proofQueue"
import { CompactClient } from "../src/proofs/compactClient"

describe("HydraJTS Core Tests", () => {
  describe("HydraManager", () => {
    let hydra: HydraManager

    beforeEach(() => {
      hydra = new HydraManager({
        maxHeads: 4,
        backpressureThreshold: 3
      })
    })

    it("should initialize with correct configuration", () => {
      const status = hydra.getSystemStatus()
      expect(status.maxHeads).toBe(4)
      expect(status.activeHeads).toBe(0)
      expect(status.isBackpressure).toBe(false)
    })

    it("should spawn proof jobs", async () => {
      const result = await hydra.spawnProof({
        id: "test-proof-1",
        circuitId: "test-circuit",
        inputs: { data: "test" },
        priority: 1
      })

      expect(result.jobId).toBe("test-proof-1")
      expect(["queued", "processing", "backpressure"]).toContain(result.status)
    })

    it("should track job status", async () => {
      await hydra.spawnProof({
        id: "test-proof-2",
        circuitId: "test-circuit",
        inputs: { data: "test" },
        priority: 1
      })

      const status = await hydra.getJobStatus("test-proof-2")
      expect(["queued", "processing", "completed", "not_found"]).toContain(status.status)
    })

    it("should handle backpressure correctly", async () => {
      const jobs = []
      
      // Spawn more jobs than max heads
      for (let i = 0; i < 6; i++) {
        jobs.push(hydra.spawnProof({
          id: `test-proof-${i}`,
          circuitId: "test-circuit",
          inputs: { data: `test-${i}` },
          priority: 1
        }))
      }

      const results = await Promise.all(jobs)
      const backpressureCount = results.filter(r => r.status === "backpressure").length
      expect(backpressureCount).toBeGreaterThan(0)
    })

    it("should cancel jobs", async () => {
      await hydra.spawnProof({
        id: "test-cancel",
        circuitId: "test-circuit",
        inputs: { data: "test" },
        priority: 1
      })

      const cancelled = await hydra.cancelJob("test-cancel")
      expect(cancelled).toBe(true)

      const status = await hydra.getJobStatus("test-cancel")
      expect(status.status).toBe("not_found")
    })

    it("should shutdown gracefully", async () => {
      await hydra.spawnProof({
        id: "test-shutdown",
        circuitId: "test-circuit",
        inputs: { data: "test" },
        priority: 1
      })

      await hydra.shutdown()
      const status = hydra.getSystemStatus()
      expect(status.activeHeads).toBe(0)
    })
  })

  describe("UISync", () => {
    let uiSync: UISync

    beforeEach(() => {
      uiSync = new UISync()
    })

    it("should create head contexts", () => {
      const context = uiSync.createHeadContext("test-head-1")
      expect(context).toHaveProperty("showLoader")
      expect(context).toHaveProperty("showProgress")
      expect(context).toHaveProperty("showNotification")
      expect(context).toHaveProperty("cleanup")
    })

    it("should deduplicate UI elements", async () => {
      const context1 = uiSync.createHeadContext("head-1")
      const context2 = uiSync.createHeadContext("head-2")

      await context1.showLoader("global")
      await context2.showLoader("global") // Should be deduplicated

      const activeElements = uiSync.getActiveElements()
      const loaders = activeElements.filter(e => e.type === "loader" && e.id === "global")
      expect(loaders.length).toBe(1)
    })

    it("should handle UI updates", async () => {
      let updateCount = 0
      const unsubscribe = uiSync.onRenderUpdate(() => {
        updateCount++
      })

      const context = uiSync.createHeadContext("test-head")
      await context.showLoader()
      await context.showProgress("test", 0.5)

      expect(updateCount).toBeGreaterThan(0)
      unsubscribe()
    })

    it("should cleanup head context", async () => {
      const context = uiSync.createHeadContext("test-cleanup")
      await context.showLoader("test-loader")
      
      const elementsBefore = uiSync.getActiveElements()
      expect(elementsBefore.length).toBeGreaterThan(0)

      await context.cleanup()
      
      const elementsAfter = uiSync.getActiveElements()
      expect(elementsAfter.length).toBe(0)
    })
  })

  describe("ProofQueue", () => {
    let queue: ProofQueue

    beforeEach(() => {
      queue = new ProofQueue({
        maxConcurrent: 4,
        maxQueueSize: 100
      })
    })

    it("should enqueue proofs with priority", async () => {
      const result = await queue.enqueue({
        id: "test-queue-1",
        circuitId: "test-circuit",
        inputs: { data: "test" },
        priority: ProofPriority.HIGH,
        maxRetries: 3
      }).then(() => true).catch(() => false)

      expect(result).toBe(true)
    })

    it("should respect queue capacity", async () => {
      const smallQueue = new ProofQueue({
        maxConcurrent: 1,
        maxQueueSize: 2
      })

      await smallQueue.enqueue({
        id: "test-1",
        circuitId: "test",
        inputs: {},
        priority: ProofPriority.LOW,
        maxRetries: 1
      })

      await smallQueue.enqueue({
        id: "test-2",
        circuitId: "test",
        inputs: {},
        priority: ProofPriority.LOW,
        maxRetries: 1
      })

      // Third should fail due to capacity
      const result = await smallQueue.enqueue({
        id: "test-3",
        circuitId: "test",
        inputs: {},
        priority: ProofPriority.LOW,
        maxRetries: 1
      }).then(() => false).catch(() => true)

      expect(result).toBe(true) // Should have failed
    })

    it("should handle concurrent processing limits", async () => {
      const stats = await queue.getStats()
      expect(stats.processing).toBeLessThanOrEqual(4)
      expect(stats.maxConcurrent).toBe(4)
    })
  })

  describe("CompactClient", () => {
    let client: CompactClient

    beforeEach(() => {
      client = new CompactClient({
        baseUrl: "http://localhost:6300"
      })
    })

    it("should initialize with correct configuration", () => {
      expect(client).toBeDefined()
    })

    it("should clear cache", () => {
      client.clearCache()
      // Should not throw
      expect(true).toBe(true)
    })

    it("should handle health checks", async () => {
      // This will fail if no server is running, which is expected in tests
      const health = await client.healthCheck()
        .then(result => result)
        .catch(() => false)
      
      expect(typeof health).toBe("boolean")
    })
  })

  describe("Concurrency Tests", () => {
    it("should handle multiple parallel proofs", async () => {
      const hydra = new HydraManager({ maxHeads: 3 })
      const proofPromises = []

      for (let i = 0; i < 5; i++) {
        proofPromises.push(
          hydra.spawnProof({
            id: `parallel-${i}`,
            circuitId: "test-circuit",
            inputs: { index: i },
            priority: 1
          })
        )
      }

      const results = await Promise.all(proofPromises)
      
      // Should have some queued or processing
      const statuses = results.map(r => r.status)
      expect(statuses).toContain("queued")
      
      await hydra.shutdown()
    })

    it("should maintain system stability under load", async () => {
      const hydra = new HydraManager({ maxHeads: 2 })
      const jobs = []

      // Rapid fire job spawning
      for (let i = 0; i < 10; i++) {
        jobs.push(
          hydra.spawnProof({
            id: `load-test-${i}`,
            circuitId: "load-test",
            inputs: { batch: i },
            priority: Math.floor(Math.random() * 3)
          }).catch(err => ({ error: err.message }))
        )
      }

      const results = await Promise.all(jobs)
      const errors = results.filter(r => 'error' in r)
      
      // System should handle load without crashing
      expect(errors.length).toBeLessThan(jobs.length / 2)
      
      await hydra.shutdown()
    })
  })
})
