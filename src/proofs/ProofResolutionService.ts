/**
 * Proof Resolution Service
 * Manages the complete lifecycle of proof tasks with deterministic state transitions
 * Implements Cassie's architecture recommendations
 */

import { Effect, pipe } from "effect"
import { v4 as uuidv4 } from "uuid"
import { ProofQueue } from "./proofQueue"
import { CompactClient } from "./compactClient"

// Canonical state machine for proof tasks
export type ProofTaskState = 
  | 'queued'     // Accepted into system, awaiting worker slot
  | 'proving'    // Compact proof generation in progress  
  | 'verifying'  // Optional verification step
  | 'resolved'   // Success - proof and artifacts available
  | 'failed'     // Terminal failure with structured error
  | 'cancelled'  // User/system-triggered abort

// Structured error types
export interface ProofClientError {
  code: 'TIMEOUT' | 'NETWORK' | 'SERVER' | 'INVALID' | 'RATE_LIMITED' | 'CANCELLED'
  message: string
  details?: any
  correlationId: string
}

// Event contract for state changes
export interface ProofStateChangeEvent {
  id: string
  state: ProofTaskState
  progress?: number  // 0..1 when available
  error?: ProofClientError
  correlationId: string
  startedAt: number
  endedAt?: number
  estimatedTime?: number
}

// Proof task with full metadata
export interface ProofTask {
  id: string
  correlationId: string
  circuitId: string
  inputs: any
  priority: 'critical' | 'normal' | 'background'
  state: ProofTaskState
  progress: number
  startedAt: number
  endedAt?: number
  result?: any
  error?: ProofClientError
  abortController: AbortController
}

// Service configuration
export interface ProofResolutionConfig {
  maxConcurrency: number
  requestTimeoutMs: number
  retryMaxAttempts: number
  backoffBaseMs: number
  backoffMaxMs: number
  proofServerUrl: string
  apiKey?: string
}

// Metrics tracking
export interface ProofMetrics {
  totalSubmitted: number
  totalResolved: number
  totalFailed: number
  totalCancelled: number
  avgLatency: number
  p95Latency: number
  currentInFlight: number
  queueDepth: number
}

export class ProofResolutionService {
  private tasks = new Map<string, ProofTask>()
  private stateChangeListeners = new Set<(event: ProofStateChangeEvent) => void>()
  private queue: ProofQueue
  private client: CompactClient
  private config: ProofResolutionConfig
  private concurrencySemaphore: number = 0
  private metrics: ProofMetrics = {
    totalSubmitted: 0,
    totalResolved: 0,
    totalFailed: 0,
    totalCancelled: 0,
    avgLatency: 0,
    p95Latency: 0,
    currentInFlight: 0,
    queueDepth: 0
  }
  private latencies: number[] = []

  constructor(config: ProofResolutionConfig) {
    this.config = config
    this.queue = new ProofQueue({ redis: null }) // Using in-memory for now
    this.client = new CompactClient(config.proofServerUrl)
    
    // Start processing loop
    this.startProcessingLoop()
  }

  /**
   * Enqueue a new proof task
   */
  async enqueue(
    circuitId: string,
    inputs: any,
    priority: ProofTask['priority'] = 'normal'
  ): Promise<string> {
    // Check if system is saturated
    if (this.queue.getQueueStats().depth >= 100) {
      throw new Error('System is busy; please try again shortly')
    }

    const id = uuidv4()
    const correlationId = uuidv4()
    const abortController = new AbortController()

    const task: ProofTask = {
      id,
      correlationId,
      circuitId,
      inputs,
      priority,
      state: 'queued',
      progress: 0,
      startedAt: Date.now(),
      abortController
    }

    this.tasks.set(id, task)
    this.metrics.totalSubmitted++
    this.metrics.queueDepth++

    // Emit state change
    this.emitStateChange(task)

    // Add to queue with priority
    await Effect.runPromise(
      this.queue.enqueue({
        id,
        circuitId,
        inputs,
        priority: this.mapPriority(priority),
        createdAt: Date.now()
      })
    )

    return id
  }

  /**
   * Cancel a proof task
   */
  cancel(taskId: string): boolean {
    const task = this.tasks.get(taskId)
    if (!task) return false

    // Can't cancel terminal states
    if (['resolved', 'failed', 'cancelled'].includes(task.state)) {
      return false
    }

    // Trigger abort
    task.abortController.abort()
    
    // Update state
    task.state = 'cancelled'
    task.endedAt = Date.now()
    task.error = {
      code: 'CANCELLED',
      message: 'Task cancelled by user',
      correlationId: task.correlationId
    }

    this.metrics.totalCancelled++
    
    // Free semaphore if was in flight
    if (task.state === 'proving' || task.state === 'verifying') {
      this.concurrencySemaphore--
      this.metrics.currentInFlight--
    }

    // Emit state change
    this.emitStateChange(task)

    return true
  }

  /**
   * Subscribe to state change events
   */
  onStateChange(listener: (event: ProofStateChangeEvent) => void): () => void {
    this.stateChangeListeners.add(listener)
    
    // Return unsubscribe function
    return () => {
      this.stateChangeListeners.delete(listener)
    }
  }

  /**
   * Get snapshot of all tasks
   */
  getSnapshot(): ProofTask[] {
    return Array.from(this.tasks.values())
  }

  /**
   * Get current metrics
   */
  getMetrics(): ProofMetrics {
    return { ...this.metrics }
  }

  /**
   * Get task by ID
   */
  getTask(taskId: string): ProofTask | undefined {
    return this.tasks.get(taskId)
  }

  // Private methods

  private async startProcessingLoop() {
    while (true) {
      // Check concurrency limit
      if (this.concurrencySemaphore >= this.config.maxConcurrency) {
        await this.sleep(100)
        continue
      }

      // Get next task from queue
      const queuedProof = await Effect.runPromise(
        this.queue.dequeue()
      ).catch(() => null)

      if (!queuedProof) {
        await this.sleep(100)
        continue
      }

      // Process task asynchronously
      this.processTask(queuedProof.id).catch(err => {
        console.error('Task processing error:', err)
      })
    }
  }

  private async processTask(taskId: string) {
    const task = this.tasks.get(taskId)
    if (!task) return

    // Acquire semaphore
    this.concurrencySemaphore++
    this.metrics.currentInFlight++
    this.metrics.queueDepth--

    try {
      // Update state to proving
      task.state = 'proving'
      task.progress = 0.1
      this.emitStateChange(task)

      // Call proof server with timeout and retries
      const result = await this.callProofServerWithRetries(task)
      
      // Check if cancelled during proving
      if (task.state === 'cancelled') return

      // Optional verification step
      if (this.shouldVerify(task.circuitId)) {
        task.state = 'verifying'
        task.progress = 0.9
        this.emitStateChange(task)
        
        await this.verifyProof(result, task)
      }

      // Success!
      task.state = 'resolved'
      task.progress = 1.0
      task.result = result
      task.endedAt = Date.now()
      
      // Update metrics
      this.metrics.totalResolved++
      const latency = task.endedAt - task.startedAt
      this.updateLatencyMetrics(latency)
      
      this.emitStateChange(task)

    } catch (error: any) {
      // Handle failure
      task.state = 'failed'
      task.endedAt = Date.now()
      task.error = this.normalizeError(error, task.correlationId)
      
      this.metrics.totalFailed++
      this.emitStateChange(task)
      
    } finally {
      // Release semaphore
      this.concurrencySemaphore--
      this.metrics.currentInFlight--
    }
  }

  private async callProofServerWithRetries(task: ProofTask): Promise<any> {
    let lastError: any
    
    for (let attempt = 0; attempt < this.config.retryMaxAttempts; attempt++) {
      try {
        // Add timeout wrapper
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('REQUEST_TIMEOUT')), this.config.requestTimeoutMs)
        })
        
        const proofPromise = this.client.generateProof(
          task.circuitId,
          task.inputs,
          {
            correlationId: task.correlationId,
            signal: task.abortController.signal
          }
        )
        
        const result = await Promise.race([proofPromise, timeoutPromise])
        return result
        
      } catch (error: any) {
        lastError = error
        
        // Don't retry on client errors (4xx) except 429
        if (error.status >= 400 && error.status < 500 && error.status !== 429) {
          throw error
        }
        
        // Don't retry if cancelled
        if (task.state === 'cancelled') {
          throw new Error('CANCELLED')
        }
        
        // Calculate backoff with jitter
        const backoff = this.calculateBackoff(attempt)
        await this.sleep(backoff)
        
        // Update progress for retry feedback
        task.progress = 0.1 + (attempt * 0.2)
        this.emitStateChange(task)
      }
    }
    
    throw lastError
  }

  private calculateBackoff(attempt: number): number {
    const base = this.config.backoffBaseMs
    const factor = Math.pow(2, attempt)
    const jitter = Math.random() * 0.4 - 0.2 // ±20%
    const backoff = base * factor * (1 + jitter)
    return Math.min(backoff, this.config.backoffMaxMs)
  }

  private shouldVerify(circuitId: string): boolean {
    // Placeholder - would check circuit config
    return circuitId.includes('critical')
  }

  private async verifyProof(proof: any, task: ProofTask): Promise<void> {
    // Placeholder verification
    await this.sleep(500)
  }

  private normalizeError(error: any, correlationId: string): ProofClientError {
    if (error.message === 'REQUEST_TIMEOUT') {
      return {
        code: 'TIMEOUT',
        message: 'Request timed out',
        correlationId,
        details: error
      }
    }
    
    if (error.message === 'CANCELLED') {
      return {
        code: 'CANCELLED', 
        message: 'Task was cancelled',
        correlationId,
        details: error
      }
    }
    
    if (error.status === 429) {
      return {
        code: 'RATE_LIMITED',
        message: 'Rate limited - please slow down requests',
        correlationId,
        details: error
      }
    }
    
    if (error.status >= 500) {
      return {
        code: 'SERVER',
        message: 'Server error - please try again',
        correlationId,
        details: error
      }
    }
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return {
        code: 'NETWORK',
        message: 'Network error - check connection',
        correlationId,
        details: error
      }
    }
    
    return {
      code: 'INVALID',
      message: error.message || 'Unknown error',
      correlationId,
      details: error
    }
  }

  private emitStateChange(task: ProofTask) {
    const event: ProofStateChangeEvent = {
      id: task.id,
      state: task.state,
      progress: task.progress,
      error: task.error,
      correlationId: task.correlationId,
      startedAt: task.startedAt,
      endedAt: task.endedAt,
      estimatedTime: task.state === 'proving' ? 30000 : undefined
    }
    
    this.stateChangeListeners.forEach(listener => {
      try {
        listener(event)
      } catch (err) {
        console.error('State change listener error:', err)
      }
    })
  }

  private updateLatencyMetrics(latency: number) {
    this.latencies.push(latency)
    if (this.latencies.length > 100) {
      this.latencies.shift()
    }
    
    // Calculate average
    this.metrics.avgLatency = this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length
    
    // Calculate P95
    const sorted = [...this.latencies].sort((a, b) => a - b)
    const p95Index = Math.floor(sorted.length * 0.95)
    this.metrics.p95Latency = sorted[p95Index] || 0
  }

  private mapPriority(priority: ProofTask['priority']): number {
    switch (priority) {
      case 'critical': return 3
      case 'normal': return 2
      case 'background': return 1
      default: return 2
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Export singleton instance
export const proofResolutionService = new ProofResolutionService({
  maxConcurrency: parseInt(process.env.MAX_CONCURRENCY || '3'),
  requestTimeoutMs: parseInt(process.env.REQUEST_TIMEOUT_MS || '30000'),
  retryMaxAttempts: parseInt(process.env.RETRY_MAX_ATTEMPTS || '3'),
  backoffBaseMs: parseInt(process.env.BACKOFF_BASE_MS || '500'),
  backoffMaxMs: parseInt(process.env.BACKOFF_MAX_MS || '10000'),
  proofServerUrl: process.env.MIDNIGHT_PROOF_SERVER_URL || 'http://localhost:6300',
  apiKey: process.env.MIDNIGHT_API_KEY
})
