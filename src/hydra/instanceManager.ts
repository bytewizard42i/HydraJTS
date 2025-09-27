/**
 * HydraJTS Instance Manager
 * Manages multiple JavaScript instances/contexts that overlay each other
 * Allows continued program execution while proofs are processing
 */

import { createSignal, createEffect } from "solid-js"

export interface HydraInstance {
  id: string
  status: 'active' | 'frozen' | 'completed'
  proofId?: string
  createdAt: number
  elements: Map<string, any> // DOM elements in this instance
  state: Map<string, any> // Application state in this instance
}

export interface ProofReturn {
  proofId: string
  instanceId: string
  result: any
  timestamp: number
}

export class InstanceManager {
  private instances: HydraInstance[] = []
  private activeInstanceId: string | null = null
  public maxInstances = 4
  private proofQueue: ProofReturn[] = []
  private mergeCallbacks: ((instance: HydraInstance) => void)[] = []
  public proofReturnMode: 'popup' | 'direct' = 'direct'
  public enabled: boolean = true
  
  constructor(config?: { maxInstances?: number }) {
    this.maxInstances = config?.maxInstances || 4
  }
  
  /**
   * Creates a new instance when a proof is called
   * Freezes current instance and creates overlay
   */
  async createInstance(proofId: string): Promise<HydraInstance | null> {
    // Check if we've hit the cap
    if (this.instances.length >= this.maxInstances) {
      console.warn(`[HydraJTS] Instance cap reached (${this.maxInstances}). Waiting for proof to return...`)
      this.showBackpressureUI()
      return null
    }
    
    // Freeze current active instance if it exists
    if (this.activeInstanceId) {
      const currentInstance = this.getInstance(this.activeInstanceId)
      if (currentInstance) {
        currentInstance.status = 'frozen'
        currentInstance.proofId = proofId
      }
    }
    
    // Create new instance
    const newInstance: HydraInstance = {
      id: `instance-${Date.now()}`,
      status: 'active',
      createdAt: Date.now(),
      elements: new Map(),
      state: new Map()
    }
    
    // Copy state from previous instance but mark duplicates
    if (this.activeInstanceId) {
      const prevInstance = this.getInstance(this.activeInstanceId)
      if (prevInstance) {
        // Clone state but track what's duplicated
        prevInstance.state.forEach((value, key) => {
          newInstance.state.set(key, { ...value, inherited: true })
        })
        
        // Clone elements but mark for potential cancellation
        prevInstance.elements.forEach((element, key) => {
          newInstance.elements.set(key, { ...element, inherited: true })
        })
      }
    }
    
    this.instances.push(newInstance)
    this.activeInstanceId = newInstance.id
    
    // Apply visual overlay effect
    this.applyOverlayEffect(newInstance)
    
    console.log(`[HydraJTS] Created new instance ${newInstance.id} while waiting for proof ${proofId}`)
    
    return newInstance
  }
  
  /**
   * Handles when a proof returns
   * Queues it for integration with active instance
   */
  handleProofReturn(proofId: string, result: any) {
    // Find the frozen instance waiting for this proof
    const waitingInstance = this.instances.find(
      inst => inst.proofId === proofId && inst.status === 'frozen'
    )
    
    if (!waitingInstance) {
      console.error(`[HydraJTS] No instance found waiting for proof ${proofId}`)
      return
    }
    
    // Queue the proof return
    const proofReturn: ProofReturn = {
      proofId,
      instanceId: waitingInstance.id,
      result,
      timestamp: Date.now()
    }
    
    this.proofQueue.push(proofReturn)
    waitingInstance.status = 'completed'
    
    console.log(`[HydraJTS] Proof ${proofId} returned. Queued for integration.`)
    
    // Process queue if not already processing
    this.processProofQueue()
  }
  
  /**
   * Process queued proof returns in order
   */
  private async processProofQueue() {
    if (this.proofQueue.length === 0) return
    
    const proofReturn = this.proofQueue.shift()!
    const instance = this.getInstance(proofReturn.instanceId)
    
    if (!instance) return
    
    // Show integration UI
    this.showProofIntegrationUI(proofReturn)
    
    // Merge the instance data back into active instance
    await this.mergeInstance(instance, proofReturn.result)
    
    // Continue processing queue
    if (this.proofQueue.length > 0) {
      setTimeout(() => this.processProofQueue(), 500)
    }
  }
  
  /**
   * Merges a completed instance back into the active instance
   * Cancels out duplicates as per the protocol design
   */
  private async mergeInstance(completedInstance: HydraInstance, proofResult: any) {
    const activeInstance = this.getInstance(this.activeInstanceId!)
    
    if (!activeInstance) return
    
    // Merge state, cancelling duplicates
    completedInstance.state.forEach((value, key) => {
      if (!value.inherited) {
        // This is unique to the completed instance, merge it
        activeInstance.state.set(key, { ...value, proofResult })
      }
    })
    
    // Remove completed instance
    this.instances = this.instances.filter(inst => inst.id !== completedInstance.id)
    
    // Notify callbacks
    this.mergeCallbacks.forEach(cb => cb(completedInstance))
    
    console.log(`[HydraJTS] Merged instance ${completedInstance.id} into active instance`)
  }
  
  /**
   * Visual effect for overlay
   */
  private applyOverlayEffect(instance: HydraInstance) {
    if (typeof window === 'undefined') return
    
    const overlay = document.createElement('div')
    overlay.id = `hydra-overlay-${instance.id}`
    overlay.className = 'hydra-instance-overlay'
    overlay.innerHTML = `
      <div class="instance-indicator">
        <span class="instance-number">${this.instances.length}</span>
        <span class="instance-label">Active Instances</span>
      </div>
    `
    
    overlay.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(102, 126, 234, 0.1);
      border: 2px solid #667eea;
      border-radius: 8px;
      padding: 8px 16px;
      z-index: 10000;
      animation: slideIn 0.3s ease-out;
      backdrop-filter: blur(4px);
    `
    
    document.body.appendChild(overlay)
    
    // Add animation
    const style = document.createElement('style')
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      
      .instance-indicator {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #667eea;
        font-weight: 600;
      }
      
      .instance-number {
        font-size: 1.5rem;
        font-weight: bold;
      }
    `
    
    if (!document.getElementById('hydra-styles')) {
      style.id = 'hydra-styles'
      document.head.appendChild(style)
    }
    
    // Remove after a few seconds
    setTimeout(() => {
      overlay.style.opacity = '0'
      setTimeout(() => overlay.remove(), 300)
    }, 3000)
  }
  
  /**
   * Show UI when hitting instance cap
   */
  private showBackpressureUI() {
    if (typeof window === 'undefined') return
    
    const warning = document.createElement('div')
    warning.id = 'hydra-backpressure'
    warning.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 8px 16px rgba(0,0,0,0.2);
      z-index: 10001;
      animation: pulse 2s infinite;
      max-width: 350px;
    `
    
    warning.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="font-size: 1.5rem;">⚡</span>
        <div>
          <strong>Instance Cap Reached!</strong><br>
          <small>Waiting for proofs to return before creating new instances...</small>
        </div>
      </div>
    `
    
    document.body.appendChild(warning)
    
    setTimeout(() => {
      warning.style.opacity = '0'
      setTimeout(() => warning.remove(), 500)
    }, 5000)
  }
  
  /**
   * Show UI when integrating a proof
   */
  private showProofIntegrationUI(proofReturn: ProofReturn) {
    if (typeof window === 'undefined') return
    
    const notification = document.createElement('div')
    notification.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 12px 24px rgba(0,0,0,0.15);
      z-index: 10002;
      animation: fadeInScale 0.3s ease-out;
    `
    
    notification.innerHTML = `
      <div style="text-align: center;">
        <div style="font-size: 2rem; margin-bottom: 12px;">✅</div>
        <strong style="color: #10b981;">Proof Integrated!</strong><br>
        <small style="color: #6b7280;">Proof ${proofReturn.proofId} has been merged</small>
      </div>
    `
    
    document.body.appendChild(notification)
    
    setTimeout(() => {
      notification.style.opacity = '0'
      notification.style.transform = 'translate(-50%, -50%) scale(0.9)'
      setTimeout(() => notification.remove(), 300)
    }, 2000)
  }
  
  // Utility methods
  getInstance(id: string): HydraInstance | undefined {
    return this.instances.find(inst => inst.id === id)
  }
  
  getActiveInstance(): HydraInstance | undefined {
    return this.activeInstanceId ? this.getInstance(this.activeInstanceId) : undefined
  }
  
  getStatus() {
    return {
      instances: this.instances.length,
      maxInstances: this.maxInstances,
      activeInstanceId: this.activeInstanceId,
      queuedProofs: this.proofQueue.length,
      frozenInstances: this.instances.filter(i => i.status === 'frozen').length
    }
  }
  
  onMerge(callback: (instance: HydraInstance) => void) {
    this.mergeCallbacks.push(callback)
  }
}

// Global instance for the app
export const hydraInstances = new InstanceManager({ maxInstances: 4 })
