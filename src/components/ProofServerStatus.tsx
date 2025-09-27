import { createSignal, onMount, Show } from "solid-js"
import { CompactClient } from "../proofs/compactClient"
import { Effect, Runtime } from "effect"

interface ServerStatus {
  connected: boolean
  serverUrl: string
  version?: string
  error?: string
  lastChecked: Date
}

export function ProofServerStatus() {
  const [status, setStatus] = createSignal<ServerStatus>({
    connected: false,
    serverUrl: "http://192.168.50.209:6300/",
    lastChecked: new Date()
  })
  const [isChecking, setIsChecking] = createSignal(false)
  const [testResult, setTestResult] = createSignal<any>(null)
  
  const runtime = Runtime.defaultRuntime
  const client = new CompactClient({
    baseUrl: status().serverUrl
  })
  
  const checkConnection = async () => {
    setIsChecking(true)
    try {
      // Health check
      const isHealthy = await Runtime.runPromise(runtime)(client.healthCheck())
      
      if (isHealthy) {
        // Try to get server info
        const response = await fetch(`${status().serverUrl}/health`)
        const data = await response.json()
        
        setStatus({
          connected: true,
          serverUrl: status().serverUrl,
          version: data.version || "v4",
          lastChecked: new Date()
        })
      } else {
        setStatus({
          connected: false,
          serverUrl: status().serverUrl,
          error: "Server is not responding",
          lastChecked: new Date()
        })
      }
    } catch (error) {
      setStatus({
        connected: false,
        serverUrl: status().serverUrl,
        error: `Connection failed: ${error}`,
        lastChecked: new Date()
      })
    } finally {
      setIsChecking(false)
    }
  }
  
  const runTestProof = async () => {
    setTestResult(null)
    setIsChecking(true)
    
    try {
      const proofResult = await Runtime.runPromise(runtime)(
        client.generateProof({
          circuitId: "test-circuit",
          inputs: {
            message: "Hello HydraJTS!",
            timestamp: Date.now()
          }
        })
      )
      
      setTestResult({
        success: true,
        proof: proofResult.proof,
        time: new Date().toISOString()
      })
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        time: new Date().toISOString()
      })
    } finally {
      setIsChecking(false)
    }
  }
  
  onMount(() => {
    checkConnection()
    // Auto-check every 30 seconds
    const interval = setInterval(checkConnection, 30000)
    return () => clearInterval(interval)
  })
  
  return (
    <div class="proof-server-status">
      <h3>🔌 Proof Server Connection</h3>
      
      <div class="status-card">
        <div class="status-header">
          <span class={`status-indicator ${status().connected ? 'connected' : 'disconnected'}`}>
            {status().connected ? '🟢' : '🔴'}
          </span>
          <span class="status-text">
            {status().connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        
        <div class="status-details">
          <div class="detail-row">
            <span class="label">Server URL:</span>
            <code>{status().serverUrl}</code>
          </div>
          
          <Show when={status().version}>
            <div class="detail-row">
              <span class="label">Version:</span>
              <span>{status().version}</span>
            </div>
          </Show>
          
          <div class="detail-row">
            <span class="label">Last Checked:</span>
            <span>{status().lastChecked.toLocaleTimeString()}</span>
          </div>
          
          <Show when={status().error}>
            <div class="error-message">
              ⚠️ {status().error}
            </div>
          </Show>
        </div>
        
        <div class="actions">
          <button 
            onClick={checkConnection} 
            disabled={isChecking()}
            class="btn-check"
          >
            {isChecking() ? 'Checking...' : 'Check Connection'}
          </button>
          
          <button 
            onClick={runTestProof}
            disabled={!status().connected || isChecking()}
            class="btn-test"
          >
            {isChecking() ? 'Generating...' : 'Test Proof Generation'}
          </button>
        </div>
        
        <Show when={testResult()}>
          <div class={`test-result ${testResult().success ? 'success' : 'error'}`}>
            <h4>Test Result:</h4>
            {testResult().success ? (
              <div>
                <p>✅ Proof generated successfully!</p>
                <code class="proof-display">
                  {String(testResult().proof).substring(0, 66)}...
                </code>
              </div>
            ) : (
              <p>❌ {testResult().error}</p>
            )}
            <small>Time: {testResult().time}</small>
          </div>
        </Show>
      </div>
      
      <style>{`
        .proof-server-status {
          margin: 2rem 0;
          padding: 1.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
        }
        
        .proof-server-status h3 {
          color: white;
          margin-bottom: 1rem;
        }
        
        .status-card {
          background: white;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .status-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #e5e7eb;
        }
        
        .status-indicator {
          font-size: 1.5rem;
        }
        
        .status-text {
          font-size: 1.25rem;
          font-weight: 600;
        }
        
        .status-indicator.connected + .status-text {
          color: #10b981;
        }
        
        .status-indicator.disconnected + .status-text {
          color: #ef4444;
        }
        
        .status-details {
          margin-bottom: 1.5rem;
        }
        
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          border-bottom: 1px solid #f3f4f6;
        }
        
        .label {
          font-weight: 500;
          color: #6b7280;
        }
        
        code {
          background: #f3f4f6;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-family: 'Monaco', monospace;
          font-size: 0.875rem;
        }
        
        .error-message {
          margin-top: 1rem;
          padding: 0.75rem;
          background: #fee2e2;
          color: #dc2626;
          border-radius: 6px;
          font-size: 0.875rem;
        }
        
        .actions {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
        }
        
        button {
          flex: 1;
          padding: 0.75rem 1rem;
          border-radius: 6px;
          border: none;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .btn-check {
          background: #3b82f6;
          color: white;
        }
        
        .btn-check:hover:not(:disabled) {
          background: #2563eb;
        }
        
        .btn-test {
          background: #10b981;
          color: white;
        }
        
        .btn-test:hover:not(:disabled) {
          background: #059669;
        }
        
        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .test-result {
          margin-top: 1.5rem;
          padding: 1rem;
          border-radius: 6px;
        }
        
        .test-result.success {
          background: #d1fae5;
          border: 1px solid #10b981;
        }
        
        .test-result.error {
          background: #fee2e2;
          border: 1px solid #ef4444;
        }
        
        .test-result h4 {
          margin: 0 0 0.5rem 0;
        }
        
        .proof-display {
          display: block;
          margin-top: 0.5rem;
          word-break: break-all;
        }
        
        small {
          display: block;
          margin-top: 0.5rem;
          color: #6b7280;
        }
      `}</style>
    </div>
  )
}
