import { createSignal, For, Show, onMount, createEffect } from "solid-js"
import { hydraInstances, InstanceManager } from "../hydra/instanceManager"
import { ProofServerStatus } from "./ProofServerStatus"
import { ProtocolSettings, useProtocolSettings } from "./ProtocolSettings"
import { ProofProgressIndicator, type ActiveProof } from "./ProofProgressIndicator"

interface ProofJob {
  id: string
  instanceId: string
  status: "processing" | "completed" | "error"
  startTime: number
  endTime?: number
  result?: any
}

export function HydraProtocol() {
  const [jobs, setJobs] = createSignal<ProofJob[]>([])
  const [systemStatus, setSystemStatus] = createSignal(hydraInstances.getStatus())
  const [isAutoMode, setIsAutoMode] = createSignal(false)
  const [activeProofs, setActiveProofs] = createSignal<ActiveProof[]>([])
  const settings = useProtocolSettings()
  
  // Update system status periodically
  onMount(() => {
    const interval = setInterval(() => {
      setSystemStatus(hydraInstances.getStatus())
    }, 500)
    
    return () => clearInterval(interval)
  })
  
  // Subscribe to instance merges
  hydraInstances.onMerge((instance) => {
    console.log(`Instance ${instance.id} merged back`)
    updateJobStatus()
  })
  
  const updateJobStatus = () => {
    setJobs(prev => prev.map(job => {
      if (job.status === "processing") {
        const status = hydraInstances.getStatus()
        // Check if this job's instance is completed
        if (status.frozenInstances === 0 && job.endTime === undefined) {
          return { ...job, status: "completed", endTime: Date.now() }
        }
      }
      return job
    }))
  }
  
  /**
   * Simulates calling a proof - this would normally be your actual proof call
   */
  const callProof = async () => {
    // Check if protocol is enabled
    if (!settings().enabled) {
      console.log("[HydraJTS] Protocol is disabled - running in blocking mode")
      // Run proof without instance management
      const proofId = `proof-${Date.now()}`
      await simulateBlockingProof(proofId)
      return
    }
    
    const proofId = `proof-${Date.now()}`
    
    // Create new instance for this proof
    const instance = await hydraInstances.createInstance(proofId)
    
    if (!instance) {
      console.warn("Cannot create new instance - at capacity")
      return
    }
    
    // Add to jobs list
    const job: ProofJob = {
      id: proofId,
      instanceId: instance.id,
      status: "processing",
      startTime: Date.now()
    }
    
    setJobs(prev => [...prev, job])
    
    // Add to active proofs for progress tracking
    const activeProof: ActiveProof = {
      id: proofId,
      instanceId: instance.id,
      layerIndex: hydraInstances.getStatus().instances - 1,
      progress: 0,
      status: 'processing',
      startTime: Date.now(),
      estimatedTime: 3000 + Math.random() * 2000
    }
    
    setActiveProofs(prev => [...prev, activeProof])
    
    // Simulate proof server call
    setTimeout(async () => {
      try {
        const response = await fetch('http://localhost:6300/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            circuitId: 'demo-circuit',
            inputs: { data: Math.random() }
          })
        })
        
        const result = await response.json()
        
        // Update active proof status
        setActiveProofs(prev => prev.map(p => 
          p.id === proofId ? { ...p, status: 'returning' as const } : p
        ))
        
        // Proof returned - handle it
        if (settings().proofReturnMode === 'popup') {
          showProofPopup(proofId, result)
        }
        hydraInstances.handleProofReturn(proofId, result)
        
        // Update job status
        setJobs(prev => prev.map(j => 
          j.id === proofId 
            ? { ...j, status: "completed", endTime: Date.now(), result }
            : j
        ))
        
        // Remove from active proofs after a delay
        setTimeout(() => {
          setActiveProofs(prev => prev.filter(p => p.id !== proofId))
        }, 1000)
        
      } catch (error) {
        console.error("Proof generation failed:", error)
        setJobs(prev => prev.map(j => 
          j.id === proofId 
            ? { ...j, status: "error", endTime: Date.now() }
            : j
        ))
        setActiveProofs(prev => prev.filter(p => p.id !== proofId))
      }
    }, 2000 + Math.random() * 3000) // Random 2-5 second delay
  }
  
  // Simulate blocking proof (when protocol is disabled)
  const simulateBlockingProof = async (proofId: string) => {
    const job: ProofJob = {
      id: proofId,
      instanceId: 'blocking',
      status: "processing",
      startTime: Date.now()
    }
    
    setJobs(prev => [...prev, job])
    
    // Block UI with loading overlay
    showBlockingOverlay(proofId)
    
    try {
      const response = await fetch('http://localhost:6300/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          circuitId: 'demo-circuit',
          inputs: { data: Math.random() }
        })
      })
      
      const result = await response.json()
      
      setJobs(prev => prev.map(j => 
        j.id === proofId 
          ? { ...j, status: "completed", endTime: Date.now(), result }
          : j
      ))
      
    } catch (error) {
      console.error("Proof generation failed:", error)
      setJobs(prev => prev.map(j => 
        j.id === proofId 
          ? { ...j, status: "error", endTime: Date.now() }
          : j
      ))
    } finally {
      hideBlockingOverlay()
    }
  }
  
  // Show proof popup (when mode is popup)
  const showProofPopup = (proofId: string, result: any) => {
    if (typeof window === 'undefined') return
    
    const popup = window.open('', `proof-${proofId}`, 'width=600,height=400')
    if (popup) {
      popup.document.write(`
        <html>
          <head>
            <title>Proof Result - ${proofId}</title>
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
              }
              .proof-container {
                background: white;
                color: #1f2937;
                border-radius: 12px;
                padding: 20px;
              }
              pre {
                background: #f3f4f6;
                padding: 12px;
                border-radius: 8px;
                overflow-x: auto;
              }
            </style>
          </head>
          <body>
            <div class="proof-container">
              <h2>✅ Proof Generated</h2>
              <p><strong>ID:</strong> ${proofId}</p>
              <p><strong>Result:</strong></p>
              <pre>${JSON.stringify(result, null, 2)}</pre>
            </div>
          </body>
        </html>
      `)
    }
  }
  
  // Show blocking overlay (when protocol is disabled)
  const showBlockingOverlay = (proofId: string) => {
    if (typeof window === 'undefined') return
    
    const overlay = document.createElement('div')
    overlay.id = 'blocking-overlay'
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `
    
    overlay.innerHTML = `
      <div style="background: white; padding: 40px; border-radius: 20px; text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 20px;">⏳</div>
        <h2 style="color: #1f2937; margin-bottom: 10px;">Generating Proof...</h2>
        <p style="color: #6b7280;">Please wait, this may take a moment</p>
        <p style="color: #9ca3af; font-size: 0.875rem; margin-top: 20px;">
          Protocol is disabled - running in blocking mode
        </p>
      </div>
    `
    
    document.body.appendChild(overlay)
  }
  
  const hideBlockingOverlay = () => {
    const overlay = document.getElementById('blocking-overlay')
    if (overlay) overlay.remove()
  }
  
  /**
   * Demonstrates the multi-instance behavior
   */
  const demonstrateProtocol = () => {
    setIsAutoMode(true)
    let count = 0
    
    const interval = setInterval(() => {
      callProof()
      count++
      
      if (count >= 6) { // Call 6 proofs to show the cap behavior
        clearInterval(interval)
        setIsAutoMode(false)
      }
    }, 1500) // Call a new proof every 1.5 seconds
  }
  
  const clearCompleted = () => {
    setJobs(prev => prev.filter(j => j.status !== "completed"))
  }
  
  return (
    <div class="hydra-protocol">
      {/* Settings Component */}
      <ProtocolSettings />
      
      <div class="protocol-header">
        <h1>🐙 HydraJTS Protocol</h1>
        <p>Multi-Instance Parallel ZK-Proof Execution</p>
        <div class="protocol-description">
          <p>
            <strong>How it works:</strong> When a proof is called, the current JavaScript instance 
            freezes and a new instance overlays it, allowing you to continue working. Up to {settings().maxResolutionLayers + 1} instances 
            can run simultaneously. When proofs return, they queue up and integrate back into the 
            active instance.
          </p>
          <Show when={!settings().enabled}>
            <div class="protocol-disabled-warning">
              ⚠️ Protocol is currently <strong>disabled</strong>. Proofs will run in blocking mode.
            </div>
          </Show>
        </div>
      </div>
      
      {/* Progress Indicators */}
      <ProofProgressIndicator activeProofs={activeProofs()} />
      
      {/* Proof Server Status */}
      <ProofServerStatus />
      
      {/* Instance Status Dashboard */}
      <div class="instance-dashboard">
        <h2>Instance Manager Status</h2>
        <div class="status-grid">
          <div class="status-card">
            <div class="status-value">{systemStatus().instances}</div>
            <div class="status-label">Active Instances</div>
          </div>
          <div class="status-card">
            <div class="status-value">{systemStatus().frozenInstances}</div>
            <div class="status-label">Frozen (Waiting)</div>
          </div>
          <div class="status-card">
            <div class="status-value">{systemStatus().queuedProofs}</div>
            <div class="status-label">Queued Returns</div>
          </div>
          <div class="status-card">
            <div class="status-value">{systemStatus().maxInstances}</div>
            <div class="status-label">Max Instances</div>
          </div>
        </div>
        
        {/* Visual Instance Representation */}
        <div class="instance-visual">
          <h3>Instance Stack Visualization</h3>
          <div class="instance-stack">
            <For each={Array(systemStatus().instances).fill(null)}>
              {(_, index) => (
                <div 
                  class={`instance-layer ${index() === systemStatus().instances - 1 ? 'active' : 'frozen'}`}
                  style={{
                    left: `${index() * 20}px`,
                    top: `${index() * 20}px`,
                    "z-index": index()
                  }}
                >
                  Instance {index() + 1}
                  {index() < systemStatus().frozenInstances && <span class="waiting">⏳</span>}
                </div>
              )}
            </For>
          </div>
        </div>
      </div>
      
      {/* Controls */}
      <div class="controls">
        <button onClick={callProof} class="btn-primary">
          🚀 Call Proof (Create Instance)
        </button>
        <button 
          onClick={demonstrateProtocol} 
          disabled={isAutoMode()}
          class="btn-demo"
        >
          ⚡ Demo Protocol (Auto)
        </button>
        <button onClick={clearCompleted} class="btn-secondary">
          🧹 Clear Completed
        </button>
      </div>
      
      {/* Jobs/Proofs List */}
      <div class="jobs-section">
        <h2>Proof Jobs</h2>
        <Show when={jobs().length > 0} fallback={<p>No proofs yet. Click "Call Proof" to start!</p>}>
          <div class="jobs-list">
            <For each={jobs()}>
              {(job) => (
                <div class={`job-item status-${job.status}`}>
                  <div class="job-header">
                    <span class="job-id">{job.id}</span>
                    <span class={`job-status ${job.status}`}>
                      {job.status === "processing" && "⚙️ Processing"}
                      {job.status === "completed" && "✅ Completed"}
                      {job.status === "error" && "❌ Error"}
                    </span>
                  </div>
                  <div class="job-details">
                    <div>Instance: {job.instanceId}</div>
                    <Show when={job.endTime}>
                      <div>Duration: {((job.endTime! - job.startTime) / 1000).toFixed(2)}s</div>
                    </Show>
                    <Show when={job.result}>
                      <div class="proof-preview">
                        Proof: <code>{String(job.result.proof).substring(0, 20)}...</code>
                      </div>
                    </Show>
                  </div>
                </div>
              )}
            </For>
          </div>
        </Show>
      </div>
      
      <style>{`
        .hydra-protocol {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        
        .protocol-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        
        .protocol-header h1 {
          font-size: 3rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 0.5rem;
        }
        
        .protocol-description {
          max-width: 800px;
          margin: 2rem auto;
          padding: 1.5rem;
          background: #f7fafc;
          border-radius: 12px;
          border-left: 4px solid #667eea;
        }
        
        .protocol-disabled-warning {
          margin-top: 1rem;
          padding: 1rem;
          background: #fef2e5;
          border: 2px solid #f59e0b;
          border-radius: 8px;
          color: #92400e;
        }
        
        .instance-dashboard {
          background: white;
          border-radius: 16px;
          padding: 2rem;
          margin: 2rem 0;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .status-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin: 1.5rem 0;
        }
        
        .status-card {
          background: linear-gradient(135deg, #f7fafc 0%, #e5e7eb 100%);
          padding: 1.5rem;
          border-radius: 12px;
          text-align: center;
        }
        
        .status-value {
          font-size: 2.5rem;
          font-weight: bold;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .status-label {
          color: #6b7280;
          font-size: 0.875rem;
          margin-top: 0.5rem;
        }
        
        .instance-visual {
          margin-top: 2rem;
        }
        
        .instance-stack {
          position: relative;
          height: 200px;
          margin: 1rem 0;
        }
        
        .instance-layer {
          position: absolute;
          width: 250px;
          height: 80px;
          background: white;
          border: 2px solid #667eea;
          border-radius: 8px;
          padding: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          transition: all 0.3s;
        }
        
        .instance-layer.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        .instance-layer.frozen {
          background: #f3f4f6;
          opacity: 0.8;
        }
        
        .instance-layer .waiting {
          margin-left: 8px;
          animation: spin 2s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .controls {
          display: flex;
          gap: 1rem;
          margin: 2rem 0;
          flex-wrap: wrap;
        }
        
        button {
          padding: 1rem 2rem;
          border-radius: 12px;
          border: none;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 1rem;
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        .btn-demo {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
        }
        
        .btn-secondary {
          background: #e2e8f0;
          color: #4a5568;
        }
        
        button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(0,0,0,0.15);
        }
        
        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .jobs-section {
          margin-top: 2rem;
        }
        
        .jobs-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }
        
        .job-item {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          border-left: 4px solid;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .job-item.status-processing {
          border-left-color: #3b82f6;
          background: linear-gradient(90deg, rgba(59,130,246,0.05) 0%, white 100%);
        }
        
        .job-item.status-completed {
          border-left-color: #10b981;
        }
        
        .job-item.status-error {
          border-left-color: #ef4444;
        }
        
        .job-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1rem;
        }
        
        .job-id {
          font-family: monospace;
          font-size: 0.875rem;
          color: #6b7280;
        }
        
        .job-status {
          font-weight: 600;
        }
        
        .job-status.processing { color: #3b82f6; }
        .job-status.completed { color: #10b981; }
        .job-status.error { color: #ef4444; }
        
        .job-details {
          font-size: 0.875rem;
          color: #6b7280;
        }
        
        .job-details div {
          margin: 0.25rem 0;
        }
        
        .proof-preview code {
          background: #f3f4f6;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
        }
      `}</style>
    </div>
  )
}
