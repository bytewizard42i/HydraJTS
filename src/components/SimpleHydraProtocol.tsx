/**
 * Simplified HydraJTS Protocol Demo - Complete with Settings
 */

import { createSignal, Show, For } from "solid-js"
import CreepyOldWayButton from "./CreepyOldWayButton"
import SettingsButton3D from "./SettingsButton3D"
import { SettingsModal } from "./SettingsModal"

interface ProofJob {
  id: string
  instanceId: string
  status: "processing" | "completed" | "error"
  startTime: number
  endTime?: number
  result?: any
}

export default function SimpleHydraProtocol() {
  const [jobs, setJobs] = createSignal<ProofJob[]>([])
  const [isAutoMode, setIsAutoMode] = createSignal(false)
  const [showSettings, setShowSettings] = createSignal(false)
  
  // Mock system status
  const systemStatus = () => ({
    instances: jobs().filter(j => j.status === 'processing').length + 1,
    frozenInstances: jobs().filter(j => j.status === 'processing').length,
    queuedProofs: 0,
    maxInstances: 4
  })
  
  const activeProofs = () => jobs().filter(j => j.status === 'processing')
  
  /**
   * Calls a proof and creates a new instance
   */
  const callProof = async () => {
    try {
      console.log('[HydraProtocol] Calling proof...')
      
      const jobId = `job-${Date.now()}`
      const newJob: ProofJob = {
        id: jobId,
        instanceId: `instance-${Date.now()}`,
        status: 'processing',
        startTime: Date.now()
      }
      
      setJobs(prev => [...prev, newJob])
      
      // Simulate proof completion after 3-5 seconds
      setTimeout(() => {
        setJobs(prev => prev.map(job => 
          job.id === jobId 
            ? { ...job, status: 'completed', endTime: Date.now(), result: { proof: 'mock-proof-data' } }
            : job
        ))
      }, 3000 + Math.random() * 2000)
      
    } catch (error) {
      console.error('[HydraProtocol] Error calling proof:', error)
    }
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
  
  const clearAll = () => {
    setJobs([])
  }
  
  return (
    <div class="hydra-protocol">
      {/* 3D Settings Button - Top Left */}
      <SettingsButton3D onClick={() => setShowSettings(true)} />
      
      {/* Settings Modal */}
      <SettingsModal 
        show={showSettings()} 
        onClose={() => setShowSettings(false)} 
      />
      
      <div class="protocol-header">
        <h1 style="text-transform: none !important;">HydraJTS PROTOCOL</h1>
        <p>Multi-Instance Parallel ZK-Proof Execution</p>
        <div class="protocol-description">
          <p>
            <strong>How it works:</strong> When a proof is called, the current JavaScript instance 
            freezes and a new instance overlays it, allowing you to continue working. Up to 4 instances 
            can run simultaneously. When proofs return, they queue up and integrate back into the 
            active instance.
          </p>
        </div>
      </div>
      
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
        <button onClick={clearAll} class="btn-reset">
          🔄 Reset All
        </button>
      </div>
      
      {/* Creepy Old Way Button */}
      <CreepyOldWayButton />
      
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
          font-size: 3.5rem;
          background: linear-gradient(135deg,
            #ffffff 0%,
            #e0f2fe 10%,
            #7c3aed 20%,
            #ec4899 40%,
            #f59e0b 60%,
            #10b981 80%,
            #ffffff 100%);
          background-size: 400% 400%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 3s ease-in-out infinite;
          margin-bottom: 0.5rem;
          font-weight: 900;
          letter-spacing: -0.02em;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          text-shadow:
            0 0 10px rgba(255, 255, 255, 0.5),
            0 0 20px rgba(124, 58, 237, 0.3),
            0 0 30px rgba(236, 72, 153, 0.3),
            2px 2px 4px rgba(0, 0, 0, 0.3),
            4px 4px 8px rgba(0, 0, 0, 0.2);
          filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.25));
          text-transform: none !important;
        }

        @keyframes shimmer {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        @keyframes squid-float {
          0%, 100% { transform: scaleX(-1) rotate(15deg) translateY(0px); }
          50% { transform: scaleX(-1) rotate(15deg) translateY(-10px); }
        }
        
        .protocol-header h1::before {
          content: '🦑';
          display: inline-block;
          transform: scaleX(-1) rotate(15deg);
          font-size: 1.2em;
          animation: squid-float 3s ease-in-out infinite;
        }
        
        .protocol-description {
          max-width: 800px;
          margin: 2rem auto;
          padding: 1.5rem;
          background: #f7fafc;
          border-radius: 12px;
          border-left: 4px solid #667eea;
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
          margin: 2rem 0;
        }
        
        .instance-layer {
          position: absolute;
          width: 200px;
          height: 80px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
          transition: all 0.3s;
        }
        
        .instance-layer.active {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          transform: scale(1.05);
        }
        
        .instance-layer.frozen {
          opacity: 0.7;
        }
        
        .waiting {
          margin-left: 0.5rem;
          animation: pulse 1s infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .controls {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin: 2rem 0;
          flex-wrap: wrap;
        }
        
        .controls button {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
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
          background: #9ca3af;
          color: white;
        }
        
        .btn-reset {
          background: #ef4444;
          color: white;
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
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-top: 1rem;
        }
        
        .job-item {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          transition: all 0.3s;
        }
        
        .job-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
        
        .job-item.status-processing {
          border-left: 4px solid #f59e0b;
        }
        
        .job-item.status-completed {
          border-left: 4px solid #10b981;
        }
        
        .job-item.status-error {
          border-left: 4px solid #ef4444;
        }
        
        .job-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        
        .job-id {
          font-family: monospace;
          color: #6b7280;
        }
        
        .job-status {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 600;
        }
        
        .job-status.processing {
          background: #fef3c7;
          color: #92400e;
        }
        
        .job-status.completed {
          background: #d1fae5;
          color: #065f46;
        }
        
        .job-status.error {
          background: #fee2e2;
          color: #991b1b;
        }
        
        .job-details {
          display: flex;
          gap: 2rem;
          color: #6b7280;
          font-size: 0.875rem;
        }
        
        .proof-preview code {
          background: #f3f4f6;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
        }
      `}</style>
    </div>
  )
}
