import { Effect, Ref, Runtime } from "effect"
import * as Schema from "@effect/schema/Schema"

// Schema for UI elements that can be deduplicated
export const UIElement = Schema.Struct({
  id: Schema.String,
  type: Schema.Literal("loader", "modal", "notification", "progress"),
  priority: Schema.Number,
  content: Schema.Unknown,
  headId: Schema.String // Which Hydra head owns this element
})

export type UIElement = Schema.Schema.Type<typeof UIElement>

/**
 * UISync manages shared UI state across multiple Hydra heads
 * It ensures overlapping UI elements are deduplicated
 */
export class UISync {
  private readonly runtime: Runtime.Runtime<never>
  private readonly uiRegistry: Map<string, UIElement>
  private readonly renderCallbacks: Set<(elements: UIElement[]) => void>
  private readonly blacklist: Ref.Ref<Set<string>>
  
  constructor() {
    this.runtime = Runtime.defaultRuntime
    this.uiRegistry = new Map()
    this.renderCallbacks = new Set()
    this.blacklist = Runtime.runSync(this.runtime)(Ref.make(new Set<string>()))
  }
  
  /**
   * Register a UI element from a Hydra head
   */
  registerElement(element: UIElement): Effect.Effect<void, never, never> {
    return Effect.gen(function* () {
      const blacklisted = yield* Ref.get(this.blacklist)
      
      // Check if element type is already blacklisted (being handled by another head)
      const elementKey = `${element.type}:${element.id}`
      
      if (!blacklisted.has(elementKey)) {
        // Add to blacklist to prevent duplication
        yield* Ref.update(this.blacklist, (set) => {
          const newSet = new Set(set)
          newSet.add(elementKey)
          return newSet
        })
        
        // Register the element
        this.uiRegistry.set(elementKey, element)
        
        // Trigger UI update
        this.notifyRender()
      }
    }.bind(this))
  }
  
  /**
   * Unregister a UI element when a head completes
   */
  unregisterElement(elementKey: string, headId: string): Effect.Effect<void, never, never> {
    return Effect.gen(function* () {
      const element = this.uiRegistry.get(elementKey)
      
      // Only remove if this head owns the element
      if (element && element.headId === headId) {
        this.uiRegistry.delete(elementKey)
        
        // Remove from blacklist
        yield* Ref.update(this.blacklist, (set) => {
          const newSet = new Set(set)
          newSet.delete(elementKey)
          return newSet
        })
        
        // Trigger UI update
        this.notifyRender()
      }
    }.bind(this))
  }
  
  /**
   * Check if a UI element should be rendered
   */
  shouldRender(elementKey: string): boolean {
    const blacklisted = Runtime.runSync(this.runtime)(Ref.get(this.blacklist))
    return !blacklisted.has(elementKey)
  }
  
  /**
   * Get all active UI elements (deduplicated)
   */
  getActiveElements(): UIElement[] {
    return Array.from(this.uiRegistry.values())
      .sort((a, b) => b.priority - a.priority) // Higher priority first
  }
  
  /**
   * Subscribe to UI updates
   */
  onRenderUpdate(callback: (elements: UIElement[]) => void) {
    this.renderCallbacks.add(callback)
    
    // Return unsubscribe function
    return () => {
      this.renderCallbacks.delete(callback)
    }
  }
  
  /**
   * Notify all subscribers of UI changes
   */
  private notifyRender() {
    const activeElements = this.getActiveElements()
    this.renderCallbacks.forEach(callback => {
      callback(activeElements)
    })
  }
  
  /**
   * Reconcile UI state when multiple heads update simultaneously
   */
  reconcile(updates: UIElement[]): Effect.Effect<void, never, never> {
    return Effect.gen(function* () {
      // Group updates by element key
      const grouped = new Map<string, UIElement[]>()
      
      for (const update of updates) {
        const key = `${update.type}:${update.id}`
        const existing = grouped.get(key) || []
        existing.push(update)
        grouped.set(key, existing)
      }
      
      // For each group, pick the highest priority element
      for (const [key, elements] of grouped) {
        const winner = elements.reduce((prev, curr) => 
          curr.priority > prev.priority ? curr : prev
        )
        
        this.uiRegistry.set(key, winner)
      }
      
      this.notifyRender()
    }.bind(this))
  }
  
  /**
   * Create a scoped UI context for a specific head
   */
  createHeadContext(headId: string) {
    const registeredElements = new Set<string>()
    
    return {
      showLoader: (id: string = "global") => {
        const elementKey = `loader:${id}`
        registeredElements.add(elementKey)
        
        return Runtime.runPromise(this.runtime)(
          this.registerElement({
            id,
            type: "loader",
            priority: 1,
            content: { message: "Processing..." },
            headId
          })
        )
      },
      
      showProgress: (id: string, progress: number) => {
        const elementKey = `progress:${id}`
        registeredElements.add(elementKey)
        
        return Runtime.runPromise(this.runtime)(
          this.registerElement({
            id,
            type: "progress",
            priority: 2,
            content: { progress, message: `${Math.round(progress * 100)}%` },
            headId
          })
        )
      },
      
      showNotification: (id: string, message: string) => {
        const elementKey = `notification:${id}`
        registeredElements.add(elementKey)
        
        return Runtime.runPromise(this.runtime)(
          this.registerElement({
            id,
            type: "notification",
            priority: 3,
            content: { message },
            headId
          })
        )
      },
      
      cleanup: () => {
        // Unregister all elements for this head
        const cleanupEffects = Array.from(registeredElements).map(elementKey =>
          this.unregisterElement(elementKey, headId)
        )
        
        return Runtime.runPromise(this.runtime)(
          Effect.all(cleanupEffects)
        )
      }
    }
  }
  
  /**
   * Debug method to visualize current UI state
   */
  debugState() {
    console.group("🐙 HydraJTS UI State")
    console.log("Active Elements:", this.uiRegistry.size)
    console.table(Array.from(this.uiRegistry.entries()).map(([key, elem]) => ({
      Key: key,
      HeadId: elem.headId,
      Priority: elem.priority,
      Content: JSON.stringify(elem.content)
    })))
    console.log("Blacklist:", Runtime.runSync(this.runtime)(Ref.get(this.blacklist)))
    console.groupEnd()
  }
}
