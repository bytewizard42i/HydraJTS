import { createSignal, Show, createEffect, onMount } from "solid-js"
import { hydraInstances } from "../hydra/instanceManager"

export interface ProtocolSettings {
  enabled: boolean
  maxResolutionLayers: number
  proofReturnMode: 'popup' | 'direct'
  showProgressIndicators: boolean
  colorCoding: boolean
  autoShowOnStart: boolean
}

// Default settings
const DEFAULT_SETTINGS: ProtocolSettings = {
  enabled: true,
  maxResolutionLayers: 3,
  proofReturnMode: 'direct',
  showProgressIndicators: true,
  colorCoding: true,
  autoShowOnStart: true
}

// Load settings from localStorage or use defaults
const loadSettings = (): ProtocolSettings => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('hydrajts-settings')
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
    }
  }
  return DEFAULT_SETTINGS
}

// Save settings to localStorage
const saveSettings = (settings: ProtocolSettings) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('hydrajts-settings', JSON.stringify(settings))
  }
}

export function ProtocolSettings() {
  const [isOpen, setIsOpen] = createSignal(false)
  const [settings, setSettings] = createSignal<ProtocolSettings>(loadSettings())
  const [hasChanges, setHasChanges] = createSignal(false)
  
  // Show on start if configured
  onMount(() => {
    if (settings().autoShowOnStart) {
      setTimeout(() => setIsOpen(true), 500)
    }
  })
  
  // Apply settings to instance manager
  createEffect(() => {
    const current = settings()
    if (hydraInstances) {
      // Update max instances (resolution layers + 1 for base)
      hydraInstances.maxInstances = current.enabled ? current.maxResolutionLayers + 1 : 1
    }
  })
  
  const updateSetting = <K extends keyof ProtocolSettings>(
    key: K, 
    value: ProtocolSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }
  
  const applySettings = () => {
    saveSettings(settings())
    setHasChanges(false)
    
    // Show confirmation
    showNotification("Settings applied successfully!")
  }
  
  const resetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS)
    setHasChanges(true)
  }
  
  const showNotification = (message: string) => {
    if (typeof window === 'undefined') return
    
    const notification = document.createElement('div')
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #10b981;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      z-index: 10003;
      animation: slideUp 0.3s ease-out;
    `
    notification.textContent = message
    document.body.appendChild(notification)
    
    setTimeout(() => {
      notification.style.opacity = '0'
      setTimeout(() => notification.remove(), 300)
    }, 2000)
  }
  
  const getLayerColors = () => {
    const colors = ['#667eea', '#f093fb', '#fbbf24', '#34d399']
    return colors.slice(0, settings().maxResolutionLayers + 1)
  }
  
  return (
    <>
      {/* Settings Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        class="settings-toggle"
        title="Protocol Settings"
      >
        ⚙️ Proof Resolution Settings
      </button>
      
      {/* Settings Modal */}
      <Show when={isOpen()}>
        <div class="settings-overlay" onClick={() => setIsOpen(false)}>
          <div class="settings-modal" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div class="settings-header">
              <h2>🎛️ Proof Resolution Settings</h2>
              <button class="close-btn" onClick={() => setIsOpen(false)}>✕</button>
            </div>
            
            {/* Settings Content */}
            <div class="settings-content">
              
              {/* Enable/Disable Protocol */}
              <div class="setting-group">
                <label class="setting-label">
                  <span class="label-text">Protocol Status</span>
                  <span class="label-description">
                    Enable multi-instance proof resolution
                  </span>
                </label>
                <div class="toggle-container">
                  <button
                    class={`toggle-option ${!settings().enabled ? 'active' : ''}`}
                    onClick={() => updateSetting('enabled', false)}
                  >
                    🚫 Disable
                  </button>
                  <button
                    class={`toggle-option ${settings().enabled ? 'active' : ''}`}
                    onClick={() => updateSetting('enabled', true)}
                  >
                    ✅ Activate
                  </button>
                </div>
              </div>
              
              {/* Resolution Layers */}
              <div class="setting-group">
                <label class="setting-label">
                  <span class="label-text">Resolution Layers</span>
                  <span class="label-description">
                    Number of additional instances allowed (proof calls)
                  </span>
                </label>
                <div class="layer-selector">
                  {[1, 2, 3].map(num => (
                    <button
                      class={`layer-option ${settings().maxResolutionLayers === num ? 'active' : ''}`}
                      onClick={() => updateSetting('maxResolutionLayers', num)}
                      disabled={!settings().enabled}
                    >
                      <div class="layer-number">{num}</div>
                      <div class="layer-label">Layer{num > 1 ? 's' : ''}</div>
                    </button>
                  ))}
                </div>
                <div class="layer-preview">
                  <span>Total Instances: {settings().enabled ? settings().maxResolutionLayers + 1 : 1}</span>
                </div>
              </div>
              
              {/* Proof Return Mode */}
              <div class="setting-group">
                <label class="setting-label">
                  <span class="label-text">Proof Return Mode</span>
                  <span class="label-description">
                    How completed proofs are displayed
                  </span>
                </label>
                <div class="mode-selector">
                  <button
                    class={`mode-option ${settings().proofReturnMode === 'popup' ? 'active' : ''}`}
                    onClick={() => updateSetting('proofReturnMode', 'popup')}
                    disabled={!settings().enabled}
                  >
                    <span class="mode-icon">🗗</span>
                    <span>Popup Windows</span>
                  </button>
                  <button
                    class={`mode-option ${settings().proofReturnMode === 'direct' ? 'active' : ''}`}
                    onClick={() => updateSetting('proofReturnMode', 'direct')}
                    disabled={!settings().enabled}
                  >
                    <span class="mode-icon">↩</span>
                    <span>Direct Integration</span>
                  </button>
                </div>
              </div>
              
              {/* Visual Options */}
              <div class="setting-group">
                <label class="setting-label">
                  <span class="label-text">Visual Indicators</span>
                  <span class="label-description">
                    Enhanced visual feedback options
                  </span>
                </label>
                <div class="visual-options">
                  <label class="checkbox-option">
                    <input
                      type="checkbox"
                      checked={settings().showProgressIndicators}
                      onChange={(e) => updateSetting('showProgressIndicators', e.target.checked)}
                      disabled={!settings().enabled}
                    />
                    <span>Show Progress Bars</span>
                  </label>
                  <label class="checkbox-option">
                    <input
                      type="checkbox"
                      checked={settings().colorCoding}
                      onChange={(e) => updateSetting('colorCoding', e.target.checked)}
                      disabled={!settings().enabled}
                    />
                    <span>Color-Coded Layers</span>
                  </label>
                  <label class="checkbox-option">
                    <input
                      type="checkbox"
                      checked={settings().autoShowOnStart}
                      onChange={(e) => updateSetting('autoShowOnStart', e.target.checked)}
                    />
                    <span>Show Settings on Startup</span>
                  </label>
                </div>
              </div>
              
              {/* Color Preview */}
              <Show when={settings().enabled && settings().colorCoding}>
                <div class="setting-group">
                  <label class="setting-label">
                    <span class="label-text">Layer Colors Preview</span>
                  </label>
                  <div class="color-preview">
                    {getLayerColors().map((color, index) => (
                      <div class="color-box" style={{ background: color }}>
                        {index === 0 ? 'Base' : `Layer ${index}`}
                      </div>
                    ))}
                  </div>
                </div>
              </Show>
            </div>
            
            {/* Footer Actions */}
            <div class="settings-footer">
              <button 
                class="btn-reset" 
                onClick={resetToDefaults}
              >
                Reset to Defaults
              </button>
              <div class="footer-actions">
                <button 
                  class="btn-cancel" 
                  onClick={() => {
                    setSettings(loadSettings())
                    setIsOpen(false)
                    setHasChanges(false)
                  }}
                >
                  Cancel
                </button>
                <button 
                  class="btn-apply" 
                  onClick={() => {
                    applySettings()
                    setIsOpen(false)
                  }}
                  disabled={!hasChanges()}
                >
                  Apply Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </Show>
      
      <style>{`
        .settings-toggle {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 12px 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          z-index: 1000;
          transition: all 0.3s;
        }
        
        .settings-toggle:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(0,0,0,0.15);
        }
        
        .settings-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          animation: fadeIn 0.3s ease-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { transform: translate(-50%, 100%); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        
        .settings-modal {
          background: white;
          border-radius: 20px;
          width: 90%;
          max-width: 700px;
          max-height: 85vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          animation: slideIn 0.3s ease-out;
        }
        
        @keyframes slideIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        
        .settings-header {
          padding: 24px;
          border-bottom: 2px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: linear-gradient(135deg, #f7fafc 0%, white 100%);
        }
        
        .settings-header h2 {
          margin: 0;
          font-size: 1.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .close-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #6b7280;
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        
        .close-btn:hover {
          background: #f3f4f6;
          color: #1f2937;
        }
        
        .settings-content {
          flex: 1;
          padding: 24px;
          overflow-y: auto;
        }
        
        .setting-group {
          margin-bottom: 32px;
        }
        
        .setting-label {
          display: block;
          margin-bottom: 12px;
        }
        
        .label-text {
          display: block;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 4px;
          font-size: 1rem;
        }
        
        .label-description {
          display: block;
          color: #6b7280;
          font-size: 0.875rem;
        }
        
        .toggle-container {
          display: flex;
          gap: 12px;
        }
        
        .toggle-option {
          flex: 1;
          padding: 12px 20px;
          background: #f3f4f6;
          border: 2px solid transparent;
          border-radius: 10px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .toggle-option:hover:not(.active) {
          background: #e5e7eb;
        }
        
        .toggle-option.active {
          background: white;
          border-color: #667eea;
          color: #667eea;
          box-shadow: 0 2px 4px rgba(102, 126, 234, 0.1);
        }
        
        .layer-selector {
          display: flex;
          gap: 16px;
        }
        
        .layer-option {
          flex: 1;
          padding: 20px;
          background: #f3f4f6;
          border: 2px solid transparent;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
        }
        
        .layer-option:hover:not(.active):not(:disabled) {
          background: #e5e7eb;
          transform: translateY(-2px);
        }
        
        .layer-option.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }
        
        .layer-option:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .layer-number {
          font-size: 2rem;
          font-weight: bold;
          margin-bottom: 4px;
        }
        
        .layer-label {
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .layer-preview {
          margin-top: 12px;
          padding: 8px 16px;
          background: #f9fafb;
          border-radius: 8px;
          text-align: center;
          color: #6b7280;
          font-size: 0.875rem;
        }
        
        .mode-selector {
          display: flex;
          gap: 16px;
        }
        
        .mode-option {
          flex: 1;
          padding: 16px;
          background: #f3f4f6;
          border: 2px solid transparent;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        
        .mode-option:hover:not(.active):not(:disabled) {
          background: #e5e7eb;
        }
        
        .mode-option.active {
          background: white;
          border-color: #667eea;
          color: #667eea;
        }
        
        .mode-option:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .mode-icon {
          font-size: 2rem;
        }
        
        .visual-options {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .checkbox-option {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: #f9fafb;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .checkbox-option:hover {
          background: #f3f4f6;
        }
        
        .checkbox-option input[type="checkbox"] {
          width: 20px;
          height: 20px;
          cursor: pointer;
        }
        
        .checkbox-option input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .color-preview {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }
        
        .color-box {
          flex: 1;
          padding: 12px;
          color: white;
          text-align: center;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 600;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .settings-footer {
          padding: 20px 24px;
          border-top: 2px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f9fafb;
        }
        
        .footer-actions {
          display: flex;
          gap: 12px;
        }
        
        .btn-reset {
          padding: 10px 20px;
          background: transparent;
          color: #6b7280;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .btn-reset:hover {
          background: #f3f4f6;
          color: #1f2937;
        }
        
        .btn-cancel {
          padding: 10px 24px;
          background: #e5e7eb;
          color: #4b5563;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .btn-cancel:hover {
          background: #d1d5db;
        }
        
        .btn-apply {
          padding: 10px 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .btn-apply:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }
        
        .btn-apply:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </>
  )
}

// Export settings loader for use in other components
export const useProtocolSettings = () => {
  const [settings, setSettings] = createSignal<ProtocolSettings>(loadSettings())
  
  createEffect(() => {
    // Listen for storage changes
    const handleStorageChange = () => {
      setSettings(loadSettings())
    }
    
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  })
  
  return settings
}
