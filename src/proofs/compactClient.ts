import { Effect, pipe, Schedule, Duration } from "effect"
import * as Schema from "@effect/schema/Schema"

// Schema for Midnight Compact proof requests and responses
export const CompactProofRequest = Schema.Struct({
  circuitId: Schema.String,
  inputs: Schema.Record({ key: Schema.String, value: Schema.Unknown }),
  provingKey: Schema.optional(Schema.String),
  verificationKey: Schema.optional(Schema.String),
  witness: Schema.optional(Schema.Unknown), // Witness data for the proof
  publicSignals: Schema.optional(Schema.Array(Schema.String)) // Public signals for verification
})

export const CompactProofResponse = Schema.Struct({
  proof: Schema.String,
  publicInputs: Schema.Array(Schema.String),
  publicSignals: Schema.optionalWith({ default: () => [] })(Schema.Array(Schema.String)),
  verificationKey: Schema.String,
  success: Schema.Boolean,
  error: Schema.optionalWith({ default: () => "" })(Schema.String),
  proofId: Schema.optional(Schema.String), // Unique identifier for the generated proof
  timestamp: Schema.optional(Schema.Number) // Timestamp of proof generation
})

export type CompactProofRequest = Schema.Schema.Type<typeof CompactProofRequest>
export type CompactProofResponse = Schema.Schema.Type<typeof CompactProofResponse>

/**
 * Client for interacting with Midnight Compact proof server
 */
export class CompactClient {
  private readonly baseUrl: string
  private readonly apiKey?: string
  private provingKeyCache = new Map<string, string>()
  private verificationKeyCache = new Map<string, string>()
  
  constructor(config: {
    baseUrl?: string
    apiKey?: string
  }) {
    // Use environment variable or default to local Docker instance
    this.baseUrl = config.baseUrl ?? process.env.MIDNIGHT_PROOF_SERVER_URL ?? "http://localhost:6300"
    this.apiKey = config.apiKey ?? process.env.MIDNIGHT_API_KEY
    
    // Log connection info in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[CompactClient] Connecting to proof server at: ${this.baseUrl}`)
    }
  }
  
   * Generate a Zero-Knowledge Proof using Compact
   */
  generateProof(
    circuitId: string, 
    inputs: any,
    options?: {
      correlationId?: string
      signal?: AbortSignal
    }
  ): Effect.Effect<CompactProofResponse, Error, never> {
    const self = this
    return pipe(
      async generateProof(
    circuitId: string, 
    inputs: any,
    options?: {
      correlationId?: string
      signal?: AbortSignal
    }
  ): Promise<ProofResult> {
    // Add correlation ID header if provided
    const headers: any = {
      'Content-Type': 'application/json'
    }
    
    if (options?.correlationId) {
      headers['x-correlation-id'] = options.correlationId
          catch: (error) => new Error(`Proof generation failed: ${error}`)
        }) as Effect.Effect<CompactProofResponse, Error, never>
        
        // Ensure response has timestamp
        const responseWithTimestamp = {
          ...response,
          timestamp: response.timestamp || Date.now()
        }
        
        // Cache keys for future use
        if (response.verificationKey) {
          self.verificationKeyCache.set(request.circuitId, response.verificationKey)
        }
        
        if (process.env.NODE_ENV !== 'production') {
          console.log(`[CompactClient] Proof generated successfully: ${responseWithTimestamp.proofId || 'unknown'}`)
        }
        
        return responseWithTimestamp
      }),
      Effect.retry(this.retryPolicy()),
      Effect.timeout(Duration.seconds(Number(process.env.PROOF_TIMEOUT_MS) / 1000 || 30))
    ) as Effect.Effect<CompactProofResponse, Error, never>
  }
  
  /**
   * Verify a proof using Compact
   */
  verifyProof(
    proof: string,
    publicInputs: string[],
    verificationKey: string,
    publicSignals?: string[]
  ): Effect.Effect<boolean, Error, never> {
    return pipe(
      Effect.tryPromise({
        try: () => this.callProofServer("/api/v1/verify", {
          proof,
          publicInputs,
          publicSignals: publicSignals || [],
          verificationKey
        }),
        catch: (error) => new Error(`Proof verification failed: ${error}`)
      }),
      Effect.map((response: any) => response.valid === true || response.result === true),
      Effect.retry(this.retryPolicy()),
      Effect.timeout(Duration.seconds(10))
    )
  }
  
  /**
   * Compile a Compact circuit
   */
  compileCircuit(
    circuitCode: string,
    circuitId: string
  ): Effect.Effect<{ provingKey: string; verificationKey: string }, Error, never> {
    return pipe(
      Effect.tryPromise({
        try: () => this.callProofServer("/api/v1/compile", {
          circuit: circuitCode,
          circuitId,
          format: "compact" // Specify Compact format for Midnight
        }),
        catch: (error) => new Error(`Circuit compilation failed: ${error}`)
      }),
      Effect.tap((keys: any) => Effect.sync(() => {
        // Cache the compiled keys
        this.provingKeyCache.set(circuitId, keys.provingKey || keys.proving_key)
        this.verificationKeyCache.set(circuitId, keys.verificationKey || keys.verification_key)
      })),
      Effect.timeout(Duration.seconds(60))
    )
  }
  
  /**
   * Batch proof generation for multiple inputs
   */
  generateBatchProofs(
    requests: CompactProofRequest[]
  ): Effect.Effect<CompactProofResponse[], Error, never> {
    return Effect.all(
      requests.map(req => this.generateProof(req)),
      { concurrency: 3 } // Process up to 3 proofs in parallel
    )
  }
  
  /**
   * Get circuit metadata
   */
  getCircuitInfo(circuitId: string): Effect.Effect<{
    constraints: number
    publicInputs: number
    privateInputs: number
    gates: number
  }, Error, never> {
    return Effect.tryPromise({
      try: async () => {
        const response = await fetch(`${this.baseUrl}/api/v1/circuits/${circuitId}`, {
          method: 'GET',
          headers: this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {}
        })
        if (!response.ok) {
          throw new Error(`Circuit info request failed: ${response.status}`)
        }
        return response.json()
      },
      catch: (error) => new Error(`Failed to get circuit info: ${error}`)
    })
  }
  
  /**
   * Health check for proof server
   */
  healthCheck(): Effect.Effect<boolean, Error, never> {
    return pipe(
      Effect.tryPromise({
        try: async () => {
          const response = await fetch(`${this.baseUrl}/health`)
          if (response.ok) {
            const data = await response.json()
            console.log('[CompactClient] Health check passed:', {
              status: data.status || 'healthy',
              version: data.version || 'unknown',
              network: data.network || process.env.MIDNIGHT_NETWORK || 'testnet'
            })
            return true
          }
          return false
        },
        catch: (error) => {
          console.error('[CompactClient] Health check failed:', error)
          return false
        }
      }),
      Effect.catchAll(() => Effect.succeed(false))
    )
  }
  
  /**
   * Internal method to call proof server API
   */
  private async callProofServer(endpoint: string, data: any): Promise<any> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Network": process.env.MIDNIGHT_NETWORK || "testnet"
    }
    
    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`
    }
    
    const url = `${this.baseUrl}${endpoint}`
    
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[CompactClient] API Request: ${endpoint}`)
    }
    
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Proof server error (${response.status}): ${error}`)
    }
    
    return response.json()
  }
  
  /**
   * Retry policy for failed requests
   */
  private retryPolicy() {
    return Schedule.exponential(Duration.seconds(1), 2).pipe(
      Schedule.jittered,
      Schedule.whileInput<Error>((error) => !error.message.includes("fatal")),
      Schedule.upTo(Duration.seconds(10))
    )
  }
  
  /**
   * Clear all cached keys
   */
  clearCache() {
    this.provingKeyCache.clear()
    this.verificationKeyCache.clear()
  }
  
  /**
   * Preload keys for specific circuits
   */
  async preloadKeys(circuitIds: string[]): Promise<void> {
    const effects = circuitIds.map(id =>
      pipe(
        this.getCircuitInfo(id),
        Effect.tap(() => Effect.logInfo(`Preloaded keys for circuit: ${id}`))
      )
    )
    
    await Effect.runPromise(Effect.all(effects, { concurrency: 5 }))
  }
}
