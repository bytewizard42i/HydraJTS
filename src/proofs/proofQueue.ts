import { Effect, Queue, Schedule, pipe } from "effect"
import * as Schema from "@effect/schema/Schema"
import { Redis } from "@upstash/redis"

// Proof priority levels
export enum ProofPriority {
  HIGH = 3,
  MEDIUM = 2,
  LOW = 1,
  BACKGROUND = 0
}

// Schema for queued proof jobs
export const QueuedProof = Schema.Struct({
  id: Schema.String,
  circuitId: Schema.String,
  inputs: Schema.Unknown,
  priority: Schema.Enums(ProofPriority),
  timestamp: Schema.Number,
  retryCount: Schema.Number,
  maxRetries: Schema.Number,
  metadata: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.Unknown }))
})

export type QueuedProof = Schema.Schema.Type<typeof QueuedProof>

/**
 * ProofQueue manages the queueing and backpressure for proof generation
 */
export class ProofQueue {
  private redis?: Redis
  private localQueue: QueuedProof[] = []
  private processing = new Set<string>()
  private readonly maxConcurrent: number
  private readonly maxQueueSize: number
  
  constructor(config: {
    maxConcurrent: number
    maxQueueSize?: number
    redisUrl?: string
  }) {
    this.maxConcurrent = config.maxConcurrent
    this.maxQueueSize = config.maxQueueSize ?? 1000
    
    if (config.redisUrl) {
      this.redis = new Redis({
        url: config.redisUrl
      })
    }
  }
  
  /**
   * Add a proof to the queue
   */
  async enqueue(proof: Omit<QueuedProof, "timestamp" | "retryCount">): Promise<Effect.Effect<boolean, Error, never>> {
    return Effect.gen(function* () {
      const queuedProof: QueuedProof = {
        ...proof,
        timestamp: Date.now(),
        retryCount: 0
      }
      
      // Check queue capacity
      const currentSize = yield* Effect.promise(() => this.getQueueSize())
      if (currentSize >= this.maxQueueSize) {
        yield* Effect.fail(new Error("Queue is at maximum capacity"))
      }
      
      if (this.redis) {
        // Use Redis for distributed queue
        const score = this.calculateScore(queuedProof)
        yield* Effect.promise(() => 
          this.redis!.zadd("hydra:proof:queue", {
            score,
            member: JSON.stringify(queuedProof)
          })
        )
      } else {
        // Use local in-memory queue
        this.localQueue.push(queuedProof)
        this.localQueue.sort((a, b) => this.calculateScore(b) - this.calculateScore(a))
      }
      
      return true
    }.bind(this))
  }
  
  /**
   * Dequeue the highest priority proof
   */
  async dequeue(): Promise<Effect.Effect<QueuedProof | null, Error, never>> {
    return Effect.gen(function* () {
      // Check if we're at concurrent limit
      if (this.processing.size >= this.maxConcurrent) {
        return null
      }
      
      let proof: QueuedProof | null = null
      
      if (this.redis) {
        // Get from Redis
        const results = yield* Effect.promise(() => 
          this.redis!.zpopmax("hydra:proof:queue", 1)
        )
        
        if (results && results.length > 0) {
          proof = JSON.parse(results[0].member as string) as QueuedProof
        }
      } else {
        // Get from local queue
        proof = this.localQueue.shift() || null
      }
      
      if (proof) {
        this.processing.add(proof.id)
      }
      
      return proof
    }.bind(this))
  }
  
  /**
   * Mark a proof as completed
   */
  async complete(proofId: string): Promise<void> {
    this.processing.delete(proofId)
    
    if (this.redis) {
      await this.redis.hdel("hydra:proof:processing", proofId)
    }
  }
  
  /**
   * Requeue a failed proof with exponential backoff
   */
  async requeue(proof: QueuedProof): Promise<Effect.Effect<boolean, Error, never>> {
    return Effect.gen(function* () {
      this.processing.delete(proof.id)
      
      if (proof.retryCount >= proof.maxRetries) {
        // Move to dead letter queue
        yield* this.moveToDeadLetter(proof)
        return false
      }
      
      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, proof.retryCount), 30000)
      yield* Effect.sleep(`${delay} millis`)
      
      // Requeue with increased retry count
      const requeuedProof: QueuedProof = {
        ...proof,
        retryCount: proof.retryCount + 1,
        timestamp: Date.now()
      }
      
      yield* this.enqueue(requeuedProof)
      return true
    }.bind(this))
  }
  
  /**
   * Get current queue size
   */
  async getQueueSize(): Promise<number> {
    if (this.redis) {
      return await this.redis.zcard("hydra:proof:queue")
    }
    return this.localQueue.length
  }
  
  /**
   * Get queue statistics
   */
  async getStats(): Promise<{
    queueSize: number
    processing: number
    maxConcurrent: number
    oldestProof: number | null
    avgWaitTime: number
  }> {
    const queueSize = await this.getQueueSize()
    
    let oldestProof: number | null = null
    let avgWaitTime = 0
    
    if (this.redis) {
      const oldest = await this.redis.zrange("hydra:proof:queue", 0, 0, { withScores: false })
      if (oldest && oldest.length > 0) {
        const proof = JSON.parse(oldest[0] as string) as QueuedProof
        oldestProof = proof.timestamp
      }
    } else if (this.localQueue.length > 0) {
      oldestProof = this.localQueue[this.localQueue.length - 1].timestamp
    }
    
    if (oldestProof) {
      avgWaitTime = Date.now() - oldestProof
    }
    
    return {
      queueSize,
      processing: this.processing.size,
      maxConcurrent: this.maxConcurrent,
      oldestProof,
      avgWaitTime
    }
  }
  
  /**
   * Calculate priority score for queue ordering
   */
  private calculateScore(proof: QueuedProof): number {
    // Higher priority and older timestamps get higher scores
    const agePenalty = (Date.now() - proof.timestamp) / 1000 // Age in seconds
    return proof.priority * 1000000 + agePenalty
  }
  
  /**
   * Move failed proof to dead letter queue
   */
  private moveToDeadLetter(proof: QueuedProof): Effect.Effect<void, Error, never> {
    return Effect.gen(function* () {
      const deadLetterProof = {
        ...proof,
        failedAt: Date.now(),
        reason: `Max retries (${proof.maxRetries}) exceeded`
      }
      
      if (this.redis) {
        yield* Effect.promise(() =>
          this.redis!.lpush("hydra:proof:deadletter", JSON.stringify(deadLetterProof))
        )
      } else {
        console.error("Dead letter proof:", deadLetterProof)
      }
    }.bind(this))
  }
  
  /**
   * Process queue continuously with backpressure
   */
  processQueue(
    handler: (proof: QueuedProof) => Effect.Effect<void, Error, never>
  ): Effect.Effect<never, Error, never> {
    return pipe(
      Effect.gen(function* () {
        const proof = yield* this.dequeue()
        
        if (proof) {
          yield* pipe(
            handler(proof),
            Effect.tap(() => Effect.promise(() => this.complete(proof.id))),
            Effect.catchAll((error) => 
              Effect.gen(function* () {
                console.error(`Proof ${proof.id} failed:`, error)
                yield* this.requeue(proof)
              }.bind(this))
            )
          )
        } else {
          // No proof available or at capacity, wait
          yield* Effect.sleep("100 millis")
        }
      }.bind(this)),
      Effect.forever,
      Effect.fork // Run in background
    )
  }
  
  /**
   * Gracefully shutdown the queue
   */
  async shutdown(): Promise<void> {
    // Wait for processing to complete
    while (this.processing.size > 0) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    if (this.redis) {
      // Save in-flight proofs back to queue
      for (const id of this.processing) {
        // Implementation would restore from processing hash
      }
    }
  }
}
