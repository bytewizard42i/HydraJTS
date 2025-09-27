/**
 * Old Way Demo - Traditional Blocking ZK Proof Generation
 * This demonstrates how traditional ZK proof generation blocks the entire UI
 * Used for comparison with HydraJTS non-blocking approach
 */

import { createSignal, Show, For } from "solid-js"

interface ProofJob {
  id: string
  status: 'waiting' | 'processing' | 'completed' | 'error'
  startTime?: number
  endTime?: number
  duration?: number
}

export default function OldWayDemo() {
  const [isBlocked, setIsBlocked] = createSignal(false)
  const [currentProof, setCurrentProof] = createSignal<ProofJob | null>(null)
  const [completedProofs, setCompletedProofs] = createSignal<ProofJob[]>([])
  const [blockingMessage, setBlockingMessage] = createSignal("Generating ZK Proof...")
  const [timeElapsed, setTimeElapsed] = createSignal(0)
  const [clickCount, setClickCount] = createSignal(0)
  
  // Simulate a blocking proof generation (50-70 seconds)
  const generateProofOldWay = async () => {
    // Random duration: 60 seconds +/- 10 seconds (50-70 seconds)
    const duration = 50000 + Math.random() * 20000
    
    const proofId = `proof-${Date.now()}`
    const proof: ProofJob = {
      id: proofId,
      status: 'processing',
      startTime: Date.now()
    }
    
    // Set UI to blocked state
    setIsBlocked(true)
    setCurrentProof(proof)
    setTimeElapsed(0)
    
    // Show different messages over time
    const messageInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - proof.startTime!) / 1000)
      setTimeElapsed(elapsed)
      
      if (elapsed < 10) {
        setBlockingMessage("🔐 Initializing proof generation...")
      } else if (elapsed < 20) {
        setBlockingMessage("⏳ Computing witness values...")
      } else if (elapsed < 30) {
        setBlockingMessage("🔧 Building constraint system...")
      } else if (elapsed < 40) {
        setBlockingMessage("📊 Generating proof parameters...")
      } else if (elapsed < 50) {
        setBlockingMessage("🎯 Finalizing zero-knowledge proof...")
      } else {
        setBlockingMessage("✅ Almost done...")
      }
    }, 1000)
    
    // Simulate the blocking wait
    await new Promise(resolve => setTimeout(resolve, duration))
    
    clearInterval(messageInterval)
    
    // Complete the proof
    proof.endTime = Date.now()
    proof.duration = (proof.endTime - proof.startTime!) / 1000
    proof.status = 'completed'
    
    setCompletedProofs(prev => [...prev, proof])
    setCurrentProof(null)
    setIsBlocked(false)
    setBlockingMessage("Generating ZK Proof...")
    setTimeElapsed(0)
  }
  
  // Track UI interaction attempts while blocked
  const handleInteraction = () => {
    if (isBlocked()) {
      setClickCount(prev => prev + 1)
    }
  }
  
  const resetDemo = () => {
    if (!isBlocked()) {
      setCompletedProofs([])
      setClickCount(0)
    }
  }
  
  const runMultipleProofs = async () => {
    // Run 3 proofs sequentially to show the pain
    for (let i = 0; i < 3; i++) {
      await generateProofOldWay()
      // Small delay between proofs
      if (i < 2) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
  }
  
  return (
    <div class="old-way-demo">
      <div class="demo-header">
        <h1>❌ Traditional ZK Proof Generation (The Old Way)</h1>
        <p class="subtitle">Experience the frustration of blocking UI during proof generation</p>
        <div class="warning-box">
          ⚠️ <strong>WARNING:</strong> This demo will freeze your UI for ~1 minute per proof.
          <br />This is intentional to demonstrate why HydraJTS was created.
        </div>
      </div>
      
      {/* Main Demo Area */}
      <div class={`demo-container ${isBlocked() ? 'blocked' : ''}`}>
        
        {/* Control Buttons */}
        <div class="controls">
          <button 
            onClick={generateProofOldWay} 
            disabled={isBlocked()}
            class="btn-primary"
          >
            🚫 Generate Proof (Blocks UI ~1min)
          </button>
          
          <button 
            onClick={runMultipleProofs} 
            disabled={isBlocked()}
            class="btn-danger"
          >
            😱 Generate 3 Proofs (Blocks ~3min)
          </button>
          
          <button 
            onClick={resetDemo} 
            disabled={isBlocked()}
            class="btn-secondary"
          >
            🔄 Reset Demo
          </button>
        </div>
        
        {/* Test Interaction Area */}
        <div class="interaction-test">
          <h3>Try to interact while proof is generating:</h3>
          <div class="test-controls">
            <button onClick={handleInteraction} class="test-btn">
              Click Me
            </button>
            <input 
              type="text" 
              placeholder="Try typing here..." 
              onInput={handleInteraction}
              class="test-input"
            />
            <select onChange={handleInteraction} class="test-select">
              <option>Select an option</option>
              <option>Option 1</option>
              <option>Option 2</option>
            </select>
          </div>
          
          <Show when={isBlocked() && clickCount() > 0}>
            <div class="frustration-counter">
              😤 Frustrated clicks/interactions: {clickCount()}
            </div>
          </Show>
        </div>
        
        {/* Completed Proofs */}
        <div class="completed-section">
          <h3>Completed Proofs</h3>
          <Show when={completedProofs().length === 0}>
            <p class="empty-state">No proofs generated yet</p>
          </Show>
          <Show when={completedProofs().length > 0}>
            <div class="proof-list">
              <For each={completedProofs()}>
                {(proof) => (
                  <div class="proof-item completed">
                    <span class="proof-id">{proof.id}</span>
                    <span class="proof-duration">
                      ⏱️ {proof.duration?.toFixed(1)}s
                    </span>
                  </div>
                )}
              </For>
            </div>
            <div class="total-time">
              Total time blocked: {
                completedProofs().reduce((acc, p) => acc + (p.duration || 0), 0).toFixed(1)
              } seconds
            </div>
          </Show>
        </div>
      </div>
      
      {/* Blocking Overlay */}
      <Show when={isBlocked()}>
        <div class="blocking-overlay">
          <div class="blocking-content">
            <div class="spinner"></div>
            <h2>{blockingMessage()}</h2>
            <div class="time-counter">
              ⏳ Time elapsed: {timeElapsed()} seconds
            </div>
            <div class="blocked-message">
              <p>❌ Cannot interact with UI</p>
              <p>❌ Cannot cancel operation</p>
              <p>❌ Cannot do anything else</p>
              <p>😔 Just have to wait...</p>
            </div>
            <div class="comparison-hint">
              👉 This is why we built HydraJTS!
            </div>
          </div>
        </div>
      </Show>
      
      {/* Styles */}
      <style>{`
        .old-way-demo {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        
        .demo-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        
        .demo-header h1 {
          font-size: 2.5rem;
          color: #dc2626;
          margin-bottom: 0.5rem;
        }
        
        .subtitle {
          color: #6b7280;
          font-size: 1.1rem;
        }
        
        .warning-box {
          background: #fef2e5;
          border: 2px solid #f59e0b;
          border-radius: 12px;
          padding: 1rem;
          margin: 1.5rem auto;
          max-width: 600px;
          color: #92400e;
        }
        
        .demo-container {
          background: white;
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          transition: opacity 0.3s;
        }
        
        .demo-container.blocked {
          opacity: 0.5;
          pointer-events: none;
        }
        
        .controls {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-bottom: 2rem;
        }
        
        .btn-primary, .btn-danger, .btn-secondary {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }
        
        .btn-primary {
          background: #6366f1;
          color: white;
        }
        
        .btn-danger {
          background: #dc2626;
          color: white;
        }
        
        .btn-secondary {
          background: #9ca3af;
          color: white;
        }
        
        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        button:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        
        .interaction-test {
          background: #f9fafb;
          border-radius: 12px;
          padding: 1.5rem;
          margin: 2rem 0;
        }
        
        .test-controls {
          display: flex;
          gap: 1rem;
          margin: 1rem 0;
          align-items: center;
        }
        
        .test-btn {
          padding: 0.5rem 1rem;
          background: #10b981;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }
        
        .test-input, .test-select {
          padding: 0.5rem;
          border: 2px solid #e5e7eb;
          border-radius: 6px;
          font-size: 1rem;
        }
        
        .frustration-counter {
          background: #fee2e2;
          color: #dc2626;
          padding: 0.75rem;
          border-radius: 8px;
          margin-top: 1rem;
          font-weight: 600;
        }
        
        .completed-section {
          margin-top: 2rem;
        }
        
        .proof-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin: 1rem 0;
        }
        
        .proof-item {
          background: #f0fdf4;
          padding: 0.75rem;
          border-radius: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .proof-id {
          font-family: monospace;
          color: #6b7280;
        }
        
        .proof-duration {
          color: #10b981;
          font-weight: 600;
        }
        
        .total-time {
          background: #fef3c7;
          padding: 1rem;
          border-radius: 8px;
          font-weight: 600;
          text-align: center;
          color: #92400e;
        }
        
        .empty-state {
          color: #9ca3af;
          text-align: center;
          padding: 2rem;
        }
        
        /* Blocking Overlay */
        .blocking-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          animation: fadeIn 0.3s;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .blocking-content {
          background: white;
          padding: 3rem;
          border-radius: 20px;
          text-align: center;
          max-width: 500px;
        }
        
        .spinner {
          width: 80px;
          height: 80px;
          margin: 0 auto 2rem;
          border: 8px solid #e5e7eb;
          border-top: 8px solid #dc2626;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .blocking-content h2 {
          color: #1f2937;
          margin-bottom: 1rem;
          font-size: 1.5rem;
        }
        
        .time-counter {
          font-size: 1.25rem;
          color: #6366f1;
          font-weight: 600;
          margin: 1rem 0;
        }
        
        .blocked-message {
          background: #fee2e2;
          padding: 1rem;
          border-radius: 12px;
          margin: 1.5rem 0;
        }
        
        .blocked-message p {
          margin: 0.5rem 0;
          color: #dc2626;
          font-weight: 500;
        }
        
        .comparison-hint {
          background: #dbeafe;
          color: #1e40af;
          padding: 1rem;
          border-radius: 12px;
          font-weight: 600;
          margin-top: 1.5rem;
        }
      `}</style>
    </div>
  )
}
