import { createSignal, For, Show } from "solid-js"
import { HydraManager } from "../hydra/headManager"
import { UISync } from "../hydra/uiSync"
import { ProofServerStatus } from "./ProofServerStatus"

interface ProofJob {
  id: string
  status: "queued" | "processing" | "completed" | "error"
  result?: any
  startTime: number
  endTime?: number
}

export function HydraDemo() {
  const [jobs, setJobs] = createSignal<ProofJob[]>([])
  const [systemStatus, setSystemStatus] = createSignal({
    activeHeads: 0,
    maxHeads: 4,
    queueSize: 0,
    isBackpressure: false
  })
  
  // Initialize HydraJTS
  const hydra = new HydraManager({ 
    maxHeads: 4,
    backpressureThreshold: 3 
  })
  
  const uiSync = new UISync()
  
  // Subscribe to UI updates
  uiSync.onRenderUpdate((elements) => {
    console.log("UI Elements:", elements)
  })
  
  const spawnProof = async () => {
    const jobId = `proof-${Date.now()}`
    const headContext = uiSync.createHeadContext(jobId)
    
    // Add to jobs list
    setJobs(prev => [...prev, {
      id: jobId,
      status: "queued",
      startTime: Date.now()
    }])
    
    // Show loader
    await headContext.showLoader(jobId)
    
    try {
      // Spawn the proof
      const spawnResult = await hydra.spawnProof({
        id: jobId,
        circuitId: "demo-circuit",
        inputs: {
          data: Math.random().toString(36).substring(7),
          timestamp: Date.now()
        },
        priority: 1
      })
      
      // Update status
      setJobs(prev => prev.map(j => 
        j.id === jobId ? { ...j, status: spawnResult.status as any } : j
      ))
      
      // Simulate proof completion
      setTimeout(async () => {
        await headContext.showProgress(jobId, 0.5)
        
        setTimeout(async () => {
          setJobs(prev => prev.map(j => 
            j.id === jobId 
              ? { 
                  ...j, 
                  status: "completed",
                  endTime: Date.now(),
                  result: { proof: "0x" + Math.random().toString(16).substring(2, 10) }
                } 
              : j
          ))
          
          await headContext.showNotification(jobId, "Proof complete!")
          await headContext.cleanup()
        }, 2000 + Math.random() * 3000)
      }, 1000)
      
    } catch (error) {
      setJobs(prev => prev.map(j => 
        j.id === jobId ? { ...j, status: "error", result: error } : j
      ))
      await headContext.cleanup()
    }
    
    // Update system status
    const status = hydra.getSystemStatus()
    setSystemStatus(status)
  }
  
  const clearCompleted = () => {
    setJobs(prev => prev.filter(j => j.status !== "completed"))
  }
  
  return (
    <div class="hydra-demo">
      <h1>🐙 HydraJTS Demo</h1>
      <p>Multi-Headed Parallel ZKProof Execution for Midnight</p>
      
      {/* Proof Server Connection Status */}
      <ProofServerStatus />
      
      {/* System Status */}
      <div class="system-status">
        <h2>System Status</h2>
        <div class="status-grid">
          <div class="status-item">
            <span>Active Heads:</span>
            <strong>{systemStatus().activeHeads} / {systemStatus().maxHeads}</strong>
          </div>
          <div class="status-item">
            <span>Queue Size:</span>
            <strong>{systemStatus().queueSize}</strong>
          </div>
          <div class="status-item">
            <span>Backpressure:</span>
            <strong class={systemStatus().isBackpressure ? "warning" : ""}>
              {systemStatus().isBackpressure ? "Active" : "Normal"}
            </strong>
          </div>
        </div>
      </div>
      
      {/* Controls */}
      <div class="controls">
        <button onClick={spawnProof} class="btn-primary">
          🚀 Spawn Proof
        </button>
        <button onClick={() => {
          // Spawn multiple proofs to test concurrency
          for (let i = 0; i < 5; i++) {
            setTimeout(() => spawnProof(), i * 200)
          }
        }} class="btn-secondary">
          ⚡ Spawn 5 Proofs
        </button>
        <button onClick={clearCompleted} class="btn-tertiary">
          🧹 Clear Completed
        </button>
      </div>
      
      {/* Jobs List */}
      <div class="jobs-list">
        <h2>Proof Jobs</h2>
        <Show when={jobs().length > 0} fallback={<p>No jobs yet. Click "Spawn Proof" to start!</p>}>
          <div class="jobs-grid">
            <For each={jobs()}>
              {(job) => (
                <div class={`job-card status-${job.status}`}>
                  <div class="job-header">
                    <span class="job-id">{job.id}</span>
                    <span class={`job-status ${job.status}`}>
                      {job.status === "processing" && "⚙️"}
                      {job.status === "completed" && "✅"}
                      {job.status === "queued" && "⏳"}
                      {job.status === "error" && "❌"}
                      {" " + job.status}
                    </span>
                  </div>
                  <Show when={job.endTime}>
                    <div class="job-duration">
                      Duration: {((job.endTime! - job.startTime) / 1000).toFixed(2)}s
                    </div>
                  </Show>
                  <Show when={job.result?.proof}>
                    <div class="job-proof">
                      Proof: <code>{job.result.proof}</code>
                    </div>
                  </Show>
                </div>
              )}
            </For>
          </div>
        </Show>
      </div>
      
      <style>{`
        .hydra-demo {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        
        h1 {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .system-status {
          background: #f7fafc;
          border-radius: 12px;
          padding: 1.5rem;
          margin: 2rem 0;
        }
        
        .status-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }
        
        .status-item {
          display: flex;
          justify-content: space-between;
          padding: 0.75rem;
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .warning {
          color: #f6ad55;
        }
        
        .controls {
          display: flex;
          gap: 1rem;
          margin: 2rem 0;
        }
        
        button {
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          border: none;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        .btn-secondary {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
        }
        
        .btn-tertiary {
          background: #e2e8f0;
          color: #4a5568;
        }
        
        button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .jobs-list {
          margin-top: 2rem;
        }
        
        .jobs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }
        
        .job-card {
          background: white;
          border-radius: 8px;
          padding: 1rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          border-left: 4px solid;
          transition: all 0.3s;
        }
        
        .job-card:hover {
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
        
        .job-card.status-queued {
          border-left-color: #fbbf24;
        }
        
        .job-card.status-processing {
          border-left-color: #60a5fa;
          animation: pulse 2s infinite;
        }
        
        .job-card.status-completed {
          border-left-color: #34d399;
        }
        
        .job-card.status-error {
          border-left-color: #f87171;
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
        
        .job-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        
        .job-id {
          font-family: 'Monaco', 'Courier New', monospace;
          font-size: 0.875rem;
          color: #6b7280;
        }
        
        .job-status {
          font-weight: 600;
          text-transform: capitalize;
        }
        
        .job-status.queued { color: #f59e0b; }
        .job-status.processing { color: #3b82f6; }
        .job-status.completed { color: #10b981; }
        .job-status.error { color: #ef4444; }
        
        .job-duration {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0.5rem 0;
        }
        
        .job-proof {
          font-size: 0.875rem;
          margin-top: 0.5rem;
        }
        
        .job-proof code {
          background: #f3f4f6;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-family: 'Monaco', 'Courier New', monospace;
        }
      `}</style>
    </div>
  )
}
