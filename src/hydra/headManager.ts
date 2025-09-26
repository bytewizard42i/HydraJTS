import { Effect, Queue, Fiber, Runtime, Layer, pipe, Exit } from "effect"
import * as Schema from "@effect/schema/Schema"
import { Worker } from "worker_threads"

// Schema definitions for type safety
export const ProofJob = Schema.Struct({
  id: Schema.String,
  circuitId: Schema.String,
  inputs: Schema.Unknown,
  priority: Schema.optionalWith({ default: () => 0 })(Schema.Number)
})

export const ProofResult = Schema.Struct({
  jobId: Schema.String,
  proof: Schema.Unknown,
  verificationKey: Schema.optionalWith({ default: () => "" })(Schema.String),
  timestamp: Schema.Number,
  duration: Schema.Number
})

export type ProofJob = Schema.Schema.Type<typeof ProofJob>
export type ProofResult = Schema.Schema.Type<typeof ProofResult>

export interface HydraManagerConfig {
  maxHeads: number
  queueCapacity?: number
  workerPath?: string
  backpressureThreshold?: number
}

export class HydraManager {
  private readonly config: Required<HydraManagerConfig>
  private readonly runtime: Runtime.Runtime<never>
  private activeHeads = new Map<string, Fiber.RuntimeFiber<ProofResult, Error>>()
  private queue: Queue.Queue<ProofJob>
  private isProcessing = false
  
  constructor(config: HydraManagerConfig) {
    this.config = {
      maxHeads: config.maxHeads,
      queueCapacity: config.queueCapacity ?? 100,
      workerPath: config.workerPath ?? new URL("./proofWorker.js", import.meta.url).pathname,
      backpressureThreshold: config.backpressureThreshold ?? Math.floor(config.maxHeads * 0.8)
    }
    
    this.runtime = Runtime.defaultRuntime
    this.initializeQueue()
  }
  
  private initializeQueue() {
    const queueEffect = Queue.bounded<ProofJob>(this.config.queueCapacity)
    this.queue = Runtime.runSync(this.runtime)(queueEffect)
  }
  
  /**
   * Spawn a new proof job - creates a Hydra head
   */
  async spawnProof(job: ProofJob): Promise<{ jobId: string; status: "queued" | "processing" | "backpressure" }> {
    // Check for backpressure
    if (this.activeHeads.size >= this.config.backpressureThreshold) {
      this.showBackpressureWarning()
      return { jobId: job.id, status: "backpressure" }
    }
    
    // Queue the job
    const enqueueEffect = Queue.offer(this.queue, job)
    const wasQueued = await Runtime.runPromise(this.runtime)(enqueueEffect)
    
    if (!wasQueued) {
      throw new Error(`Queue is full. Cannot accept job ${job.id}`)
    }
    
    // Start processing if not already running
    if (!this.isProcessing) {
      this.startProcessing()
    }
    
    return {
      jobId: job.id,
      status: this.activeHeads.size < this.config.maxHeads ? "processing" : "queued"
    }
  }
  
  /**
   * Main processing loop - manages Hydra heads
   */
  private startProcessing() {
    this.isProcessing = true
    
    const processLoop = Effect.gen(function* () {
      while (true) {
        // Wait for available slot
        if (this.activeHeads.size >= this.config.maxHeads) {
          yield* Effect.sleep("100 millis")
          continue
        }
        
        // Get next job from queue
        const job = yield* Queue.poll(this.queue)
        
        if (job === null) {
          // No jobs in queue, wait a bit
          yield* Effect.sleep("500 millis")
          continue
        }
        
        // Spawn a new head for this job
        yield* Effect.async<void>((resume) => {
          this.spawnHead(job).then(() => resume(Effect.succeed(undefined)))
        })
      }
    })
    
    // Run the process loop as a fiber
    Runtime.runFork(this.runtime)(processLoop)
  }
  
  /**
   * Spawn a single Hydra head (worker thread)
   */
  private async spawnHead(job: ProofJob): Promise<void> {
    const startTime = Date.now()
    
    // Create the proof effect
    const proofEffect = pipe(
      Effect.tryPromise({
        try: async () => {
          return new Promise<ProofResult>((resolve, reject) => {
            const worker = new Worker(this.config.workerPath, {
              workerData: { job }
            })
            
            worker.on("message", (result: any) => {
              worker.terminate()
              // Transform the result to match ProofResult schema
              resolve({
                jobId: result.jobId || job.id,
                proof: result.proof,
                verificationKey: result.verificationKey || "",
                timestamp: result.timestamp || Date.now(),
                duration: result.duration || result.processingTime || (Date.now() - startTime)
              })
            })
            
            worker.on("error", (err: Error) => {
              worker.terminate()
              reject(err)
            })
            
            worker.on("exit", (code) => {
              if (code !== 0) {
                reject(new Error(`Worker stopped with exit code ${code}`))
              }
            })
          })
        },
        catch: (error) => new Error(`Failed to spawn proof: ${error}`)
      }),
      Effect.fork
    )
    
    // Run as fiber
    const fiber = Runtime.runFork(this.runtime)(proofEffect)
    this.activeHeads.set(job.id, fiber as any)
    
    // Wait for fiber completion
    fiber.await.pipe(
      Runtime.runPromise(this.runtime)
    ).then(() => {
      this.activeHeads.delete(job.id)
      this.hideBackpressureWarning()
    }).catch((error) => {
      console.error(`Head ${job.id} failed:`, error)
      this.activeHeads.delete(job.id)
    })
  }
  
  /**
   * Get status of a specific job
   */
  async getJobStatus(jobId: string): Promise<{
    status: "queued" | "processing" | "completed" | "not_found"
    result?: ProofResult
  }> {
    const head = this.activeHeads.get(jobId)
    
    if (head) {
      const poll = Fiber.poll(head)
      const pollResult = await Runtime.runPromise(this.runtime)(poll)
      
      if (pollResult._tag === "Some") {
        if (pollResult.value._tag === "Success") {
          return { status: "completed", result: pollResult.value.value }
        }
      }
      return { status: "processing" }
    }
    
    // Check if in queue
    const queueSnapshot = await Runtime.runPromise(this.runtime)(Queue.takeAll(this.queue))
    const inQueue = Array.from(queueSnapshot).some(j => j.id === jobId)
    
    // Put items back
    for (const item of queueSnapshot) {
      await Runtime.runPromise(this.runtime)(Queue.offer(this.queue, item))
    }
    
    return { status: inQueue ? "queued" : "not_found" }
  }
  
  /**
   * Cancel a specific job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    const head = this.activeHeads.get(jobId)
    
    if (head) {
      const interrupt = Fiber.interrupt(head)
      await Runtime.runPromise(this.runtime)(interrupt)
      this.activeHeads.delete(jobId)
      return true
    }
    
    return false
  }
  
  /**
   * Get current system status
   */
  getSystemStatus() {
    return {
      activeHeads: this.activeHeads.size,
      maxHeads: this.config.maxHeads,
      queueSize: Runtime.runSync(this.runtime)(Queue.size(this.queue)),
      queueCapacity: this.config.queueCapacity,
      isBackpressure: this.activeHeads.size >= this.config.backpressureThreshold
    }
  }
  
  /**
   * UI feedback for backpressure
   */
  private showBackpressureWarning() {
    if (typeof window !== "undefined" && !document.getElementById("hydra-backpressure")) {
      const warning = document.createElement("div")
      warning.id = "hydra-backpressure"
      warning.className = "hydra-warning"
      warning.innerHTML = `
        <div style="position: fixed; top: 20px; right: 20px; background: #ff9800; color: white; padding: 12px 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); z-index: 9999;">
          <strong>⚡ HydraJTS:</strong> Multiple proofs running in parallel.
          <br>Let's wait a moment for the system to catch up...
        </div>
      `
      document.body.appendChild(warning)
    }
  }
  
  private hideBackpressureWarning() {
    if (typeof window !== "undefined") {
      const warning = document.getElementById("hydra-backpressure")
      if (warning && this.activeHeads.size < this.config.backpressureThreshold) {
        warning.remove()
      }
    }
  }
  
  /**
   * Shutdown the manager gracefully
   */
  async shutdown() {
    this.isProcessing = false
    
    // Cancel all active heads
    const cancellations = Array.from(this.activeHeads.keys()).map(id => this.cancelJob(id))
    await Promise.all(cancellations)
    
    // Clear the queue
    await Runtime.runPromise(this.runtime)(Queue.takeAll(this.queue))
  }
}
