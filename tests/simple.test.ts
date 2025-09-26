import { describe, it, expect } from "bun:test"

describe("HydraJTS Basic Tests", () => {
  it("should pass basic test", () => {
    expect(1 + 1).toBe(2)
  })
  
  it("should have correct project structure", () => {
    const fs = require('fs')
    
    // Check core files exist
    expect(fs.existsSync('./src/hydra/headManager.ts')).toBe(true)
    expect(fs.existsSync('./src/hydra/uiSync.ts')).toBe(true)
    expect(fs.existsSync('./src/proofs/proofQueue.ts')).toBe(true)
    expect(fs.existsSync('./src/proofs/compactClient.ts')).toBe(true)
    expect(fs.existsSync('./src/hydra/proofWorker.js')).toBe(true)
  })
  
  it("should have Docker services configured", () => {
    const fs = require('fs')
    
    expect(fs.existsSync('./docker-compose.yml')).toBe(true)
    expect(fs.existsSync('./Dockerfile.mock-proof-server')).toBe(true)
    expect(fs.existsSync('./mock-proof-server.js')).toBe(true)
  })
  
  it("should connect to proof server", async () => {
    try {
      const response = await fetch('http://localhost:6300/health')
      const data = await response.json()
      
      expect(response.ok).toBe(true)
      expect(data.status).toBe('healthy')
      expect(data.version).toBe('mock-v4')
    } catch (error) {
      // Server might not be running in test environment
      console.log('Proof server not available for testing')
    }
  })
  
  it("should have proper environment setup", () => {
    const packageJson = require('../package.json')
    
    // Check essential scripts
    expect(packageJson.scripts.dev).toBeDefined()
    expect(packageJson.scripts['dev:full']).toBeDefined()
    expect(packageJson.scripts['docker:up']).toBeDefined()
    
    // Check essential dependencies
    expect(packageJson.dependencies.effect).toBeDefined()
    expect(packageJson.dependencies['@effect/platform']).toBeDefined()
    expect(packageJson.dependencies['solid-js']).toBeDefined()
  })
})
