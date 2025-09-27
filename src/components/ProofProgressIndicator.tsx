import { createSignal, For, Show, onMount, onCleanup } from "solid-js"
import { useProtocolSettings } from "./ProtocolSettings"

export interface ActiveProof {
  id: string
  instanceId: string
  layerIndex: number
  progress: number
  status: 'waiting' | 'processing' | 'returning' | 'completed'
  startTime: number
  estimatedTime?: number
}

interface ProofProgressIndicatorProps {
  activeProofs: ActiveProof[]
}

export function ProofProgressIndicator(props: ProofProgressIndicatorProps) {
  const settings = useProtocolSettings()
  const [animationFrame, setAnimationFrame] = createSignal(0)
  
  // Color scheme for layers
  const layerColors = ['#667eea', '#f093fb', '#fbbf24', '#34d399']
  
  // Animate progress bars
  onMount(() => {
    let frameId: number
    const animate = () => {
      setAnimationFrame(prev => prev + 1)
      frameId = requestAnimationFrame(animate)
    }
    frameId = requestAnimationFrame(animate)
    
    onCleanup(() => cancelAnimationFrame(frameId))
  })
  
  const getProgressWidth = (proof: ActiveProof) => {
    if (proof.status === 'completed') return '100%'
    if (proof.status === 'returning') return '90%'
    if (proof.status === 'processing') {
      // Simulate progress based on time elapsed
      const elapsed = Date.now() - proof.startTime
      const estimated = proof.estimatedTime || 3000
      const progress = Math.min((elapsed / estimated) * 80, 80)
      return `${progress}%`
    }
    return '10%'
  }
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'waiting': return '⏳'
      case 'processing': return '⚙️'
      case 'returning': return '↩️'
      case 'completed': return '✅'
      default: return '❓'
    }
  }
  
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const deciseconds = Math.floor((ms % 1000) / 100)
    return `${seconds}.${deciseconds}s`
  }
  
  return (
    <Show when={settings().enabled && settings().showProgressIndicators && props.activeProofs.length > 0}>
      <div class="proof-progress-container">
        <div class="progress-header">
          <h3>🔄 Active Proof Generation</h3>
          <span class="proof-count">{props.activeProofs.length} proof{props.activeProofs.length !== 1 ? 's' : ''}</span>
        </div>
        
        <div class="progress-list">
          <For each={props.activeProofs}>
            {(proof) => {
              const color = settings().colorCoding 
                ? layerColors[proof.layerIndex % layerColors.length]
                : '#667eea'
              const elapsed = Date.now() - proof.startTime
              
              return (
                <div class="proof-progress-item" style={{ "border-left-color": color }}>
                  <div class="progress-info">
                    <div class="progress-header-row">
                      <span class="proof-id">
                        {getStatusIcon(proof.status)} Proof #{proof.id.slice(-6)}
                      </span>
                      <span class="layer-badge" style={{ background: color }}>
                        Layer {proof.layerIndex}
                      </span>
                      <span class="elapsed-time">
                        {formatTime(elapsed)}
                      </span>
                    </div>
                    
                    <div class="progress-bar-container">
                      <div 
                        class="progress-bar"
                        style={{ 
                          width: getProgressWidth(proof),
                          background: `linear-gradient(90deg, ${color}dd 0%, ${color} 100%)`
                        }}
                      >
                        <div class="progress-shimmer" />
                      </div>
                    </div>
                    
                    <div class="progress-status">
                      <span class="status-text">
                        {proof.status === 'waiting' && 'Waiting in queue...'}
                        {proof.status === 'processing' && 'Generating proof...'}
                        {proof.status === 'returning' && 'Integrating result...'}
                        {proof.status === 'completed' && 'Completed!'}
                      </span>
                    </div>
                  </div>
                </div>
              )
            }}
          </For>
        </div>
        
        {/* Floating Banner Version */}
        <Show when={settings().colorCoding}>
          <div class="floating-progress-banner">
            <For each={props.activeProofs.slice(0, 4)}>
              {(proof, index) => {
                const color = layerColors[proof.layerIndex % layerColors.length]
                return (
                  <div 
                    class="banner-item"
                    style={{ 
                      background: color,
                      "animation-delay": `${index() * 0.1}s`
                    }}
                    title={`Proof ${proof.id.slice(-6)}`}
                  >
                    <span class="banner-icon">{getStatusIcon(proof.status)}</span>
                  </div>
                )
              }}
            </For>
          </div>
        </Show>
      </div>
      
      <style>{`
        .proof-progress-container {
          background: white;
          border-radius: 16px;
          padding: 20px;
          margin: 20px 0;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 2px solid #e5e7eb;
        }
        
        .progress-header h3 {
          margin: 0;
          color: #1f2937;
        }
        
        .proof-count {
          background: #f3f4f6;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.875rem;
          color: #6b7280;
        }
        
        .progress-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .proof-progress-item {
          background: #f9fafb;
          border-radius: 12px;
          padding: 16px;
          border-left: 4px solid;
          transition: all 0.3s;
        }
        
        .proof-progress-item:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          transform: translateX(2px);
        }
        
        .progress-header-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }
        
        .proof-id {
          font-weight: 600;
          color: #374151;
          font-family: monospace;
        }
        
        .layer-badge {
          padding: 2px 8px;
          border-radius: 12px;
          color: white;
          font-size: 0.75rem;
          font-weight: 600;
        }
        
        .elapsed-time {
          margin-left: auto;
          color: #6b7280;
          font-size: 0.875rem;
          font-family: monospace;
        }
        
        .progress-bar-container {
          height: 24px;
          background: #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
          position: relative;
        }
        
        .progress-bar {
          height: 100%;
          border-radius: 12px;
          transition: width 0.3s ease-out;
          position: relative;
          overflow: hidden;
        }
        
        .progress-shimmer {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.3) 50%,
            transparent 100%
          );
          animation: shimmer 2s infinite;
        }
        
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        
        .progress-status {
          margin-top: 8px;
        }
        
        .status-text {
          color: #6b7280;
          font-size: 0.875rem;
          font-style: italic;
        }
        
        /* Floating Banner */
        .floating-progress-banner {
          position: fixed;
          top: 80px;
          right: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          z-index: 999;
        }
        
        .banner-item {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.5rem;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          animation: pulse 2s infinite;
          cursor: pointer;
          transition: all 0.3s;
        }
        
        .banner-item:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 16px rgba(0,0,0,0.2);
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        .banner-icon {
          animation: rotate 3s linear infinite;
        }
        
        @keyframes rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </Show>
  )
}
