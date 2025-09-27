/**
 * System Resource Monitor for HydraJTS
 * Dynamically adjusts instance capacity based on available system resources
 */

export interface SystemResources {
  cpuCores: number
  totalMemoryGB: number
  availableMemoryGB: number
  cpuUsagePercent: number
  memoryUsagePercent: number
  browserType: string
  performanceScore: number
}

export interface ResourceRecommendation {
  recommendedInstances: number
  maxSafeInstances: number
  currentCapacity: 'optimal' | 'limited' | 'constrained' | 'critical'
  constraints: string[]
  warning?: string
}

export class SystemResourceMonitor {
  private lastCheck: number = 0
  private checkInterval: number = 5000 // Check every 5 seconds
  private cachedResources: SystemResources | null = null
  private performanceHistory: number[] = []
  
  /**
   * Get current system resources
   */
  async getSystemResources(): Promise<SystemResources> {
    // Use cached value if recent
    if (this.cachedResources && Date.now() - this.lastCheck < this.checkInterval) {
      return this.cachedResources
    }
    
    const resources: SystemResources = {
      cpuCores: this.getCPUCores(),
      totalMemoryGB: await this.getTotalMemory(),
      availableMemoryGB: await this.getAvailableMemory(),
      cpuUsagePercent: await this.getCPUUsage(),
      memoryUsagePercent: 0,
      browserType: this.getBrowserType(),
      performanceScore: await this.calculatePerformanceScore()
    }
    
    // Calculate memory usage percentage
    resources.memoryUsagePercent = 
      ((resources.totalMemoryGB - resources.availableMemoryGB) / resources.totalMemoryGB) * 100
    
    this.cachedResources = resources
    this.lastCheck = Date.now()
    
    return resources
  }
  
  /**
   * Get CPU core count
   */
  private getCPUCores(): number {
    if (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) {
      return navigator.hardwareConcurrency
    }
    return 4 // Default fallback
  }
  
  /**
   * Get total system memory (GB)
   */
  private async getTotalMemory(): Promise<number> {
    if (typeof navigator !== 'undefined' && 'deviceMemory' in navigator) {
      // @ts-ignore - deviceMemory is experimental
      return navigator.deviceMemory || 8
    }
    
    // Estimate based on performance
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      // @ts-ignore - memory is non-standard
      const memoryInfo = performance.memory
      if (memoryInfo && memoryInfo.jsHeapSizeLimit) {
        // Convert bytes to GB and estimate total system memory
        return Math.ceil(memoryInfo.jsHeapSizeLimit / (1024 * 1024 * 1024)) * 2
      }
    }
    
    return 8 // Default 8GB
  }
  
  /**
   * Get available memory (GB)
   */
  private async getAvailableMemory(): Promise<number> {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      // @ts-ignore - memory is non-standard
      const memoryInfo = performance.memory
      if (memoryInfo) {
        const used = memoryInfo.usedJSHeapSize / (1024 * 1024 * 1024)
        const limit = memoryInfo.jsHeapSizeLimit / (1024 * 1024 * 1024)
        return Math.max(0, limit - used)
      }
    }
    
    // Estimate as 50% of total if we can't measure
    const total = await this.getTotalMemory()
    return total * 0.5
  }
  
  /**
   * Estimate CPU usage
   */
  private async getCPUUsage(): Promise<number> {
    // Run a quick benchmark
    const start = performance.now()
    let sum = 0
    
    // Simple CPU intensive task
    for (let i = 0; i < 1000000; i++) {
      sum += Math.sqrt(i)
    }
    
    const duration = performance.now() - start
    
    // Normalize to percentage (lower duration = less CPU usage)
    // Baseline: 10ms = 0% usage, 100ms = 100% usage
    const usage = Math.min(100, Math.max(0, (duration - 10) / 0.9))
    
    return usage
  }
  
  /**
   * Detect browser type
   */
  private getBrowserType(): string {
    if (typeof navigator === 'undefined') return 'unknown'
    
    const userAgent = navigator.userAgent.toLowerCase()
    if (userAgent.includes('chrome')) return 'chrome'
    if (userAgent.includes('firefox')) return 'firefox'
    if (userAgent.includes('safari')) return 'safari'
    if (userAgent.includes('edge')) return 'edge'
    return 'other'
  }
  
  /**
   * Calculate overall performance score (0-100)
   */
  private async calculatePerformanceScore(): Promise<number> {
    const benchmarks: number[] = []
    
    // Test 1: Array operations
    const t1 = performance.now()
    const arr = Array(10000).fill(0).map((_, i) => i * 2)
    benchmarks.push(performance.now() - t1)
    
    // Test 2: Object operations
    const t2 = performance.now()
    const obj: any = {}
    for (let i = 0; i < 10000; i++) {
      obj[`key${i}`] = { value: i, squared: i * i }
    }
    benchmarks.push(performance.now() - t2)
    
    // Test 3: String operations
    const t3 = performance.now()
    let str = ''
    for (let i = 0; i < 1000; i++) {
      str += 'test' + i
    }
    benchmarks.push(performance.now() - t3)
    
    // Calculate score (lower total time = higher score)
    const totalTime = benchmarks.reduce((a, b) => a + b, 0)
    const score = Math.max(0, Math.min(100, 100 - (totalTime - 5) * 2))
    
    this.performanceHistory.push(score)
    if (this.performanceHistory.length > 10) {
      this.performanceHistory.shift()
    }
    
    return score
  }
  
  /**
   * Get recommendation for number of instances
   */
  async getResourceRecommendation(
    currentInstances: number = 0
  ): Promise<ResourceRecommendation> {
    const resources = await this.getSystemResources()
    const constraints: string[] = []
    let recommendedInstances = 4 // Default
    let maxSafeInstances = 4
    
    // CPU-based constraints
    if (resources.cpuCores <= 2) {
      maxSafeInstances = Math.min(maxSafeInstances, 1)
      constraints.push('Limited CPU cores')
    } else if (resources.cpuCores <= 4) {
      maxSafeInstances = Math.min(maxSafeInstances, 2)
      constraints.push('Moderate CPU cores')
    } else if (resources.cpuCores <= 8) {
      maxSafeInstances = Math.min(maxSafeInstances, 3)
    }
    
    // Memory-based constraints
    if (resources.availableMemoryGB < 1) {
      maxSafeInstances = Math.min(maxSafeInstances, 1)
      constraints.push('Low available memory')
    } else if (resources.availableMemoryGB < 2) {
      maxSafeInstances = Math.min(maxSafeInstances, 2)
      constraints.push('Limited memory available')
    } else if (resources.availableMemoryGB < 4) {
      maxSafeInstances = Math.min(maxSafeInstances, 3)
    }
    
    // CPU usage constraints
    if (resources.cpuUsagePercent > 80) {
      maxSafeInstances = Math.min(maxSafeInstances, 1)
      constraints.push('High CPU usage')
    } else if (resources.cpuUsagePercent > 60) {
      maxSafeInstances = Math.min(maxSafeInstances, 2)
      constraints.push('Moderate CPU load')
    } else if (resources.cpuUsagePercent > 40) {
      maxSafeInstances = Math.min(maxSafeInstances, 3)
    }
    
    // Performance score constraints
    if (resources.performanceScore < 30) {
      maxSafeInstances = Math.min(maxSafeInstances, 1)
      constraints.push('Low performance score')
    } else if (resources.performanceScore < 60) {
      maxSafeInstances = Math.min(maxSafeInstances, 2)
      constraints.push('Moderate performance')
    } else if (resources.performanceScore < 80) {
      maxSafeInstances = Math.min(maxSafeInstances, 3)
    }
    
    // Browser-specific optimizations
    if (resources.browserType === 'chrome' || resources.browserType === 'edge') {
      // V8 engine handles multi-threading well
      recommendedInstances = maxSafeInstances
    } else if (resources.browserType === 'firefox') {
      // SpiderMonkey is good but slightly less optimized for this
      recommendedInstances = Math.max(1, maxSafeInstances - 1)
    } else {
      // Conservative for other browsers
      recommendedInstances = Math.max(1, Math.floor(maxSafeInstances * 0.75))
    }
    
    // Determine capacity level
    let capacity: ResourceRecommendation['currentCapacity'] = 'optimal'
    if (maxSafeInstances <= 1) {
      capacity = 'critical'
    } else if (maxSafeInstances <= 2) {
      capacity = 'constrained'
    } else if (maxSafeInstances <= 3) {
      capacity = 'limited'
    }
    
    // Generate warning if trying to exceed recommended
    let warning: string | undefined
    if (currentInstances > maxSafeInstances) {
      warning = `⚠️ Additional resolution layers are not available at this time due to system constraints: ${constraints.join(', ')}`
    } else if (currentInstances === maxSafeInstances && constraints.length > 0) {
      warning = `ℹ️ System at capacity. Constraints: ${constraints.join(', ')}`
    }
    
    return {
      recommendedInstances,
      maxSafeInstances,
      currentCapacity: capacity,
      constraints,
      warning
    }
  }
  
  /**
   * Get a simple resource summary
   */
  async getResourceSummary(): Promise<string> {
    const resources = await this.getSystemResources()
    const recommendation = await this.getResourceRecommendation()
    
    return `
System Resources:
• CPU: ${resources.cpuCores} cores (${resources.cpuUsagePercent.toFixed(1)}% usage)
• Memory: ${resources.availableMemoryGB.toFixed(1)}GB / ${resources.totalMemoryGB.toFixed(1)}GB available
• Performance Score: ${resources.performanceScore.toFixed(0)}/100
• Browser: ${resources.browserType}
• Recommended Instances: ${recommendation.recommendedInstances}
• Max Safe Instances: ${recommendation.maxSafeInstances}
• Status: ${recommendation.currentCapacity}
${recommendation.constraints.length > 0 ? `• Constraints: ${recommendation.constraints.join(', ')}` : ''}
    `.trim()
  }
  
  /**
   * Monitor resources continuously
   */
  startMonitoring(callback: (recommendation: ResourceRecommendation) => void): () => void {
    const interval = setInterval(async () => {
      const recommendation = await this.getResourceRecommendation()
      callback(recommendation)
    }, this.checkInterval)
    
    // Return cleanup function
    return () => clearInterval(interval)
  }
}

// Export singleton instance
export const resourceMonitor = new SystemResourceMonitor()
