/**
 * Settings Modal - Simple wrapper for ProtocolSettings
 */

import { createSignal, Show } from "solid-js"

interface SettingsModalProps {
  show: boolean
  onClose: () => void
}

export function SettingsModal(props: SettingsModalProps) {
  
  const handleClose = () => {
    props.onClose()
  }
  
  return (
    <Show when={props.show}>
      <div class="settings-overlay" onClick={handleClose}>
        <div class="settings-modal" onClick={(e) => e.stopPropagation()}>
          <div class="settings-header">
            <h2>⚙️ HydraJTS Settings</h2>
            <button class="close-btn" onClick={handleClose}>✕</button>
          </div>
          
          <div class="settings-content">
            <div class="setting-group">
              <label class="setting-label">
                <span class="label-text">Max Instances</span>
                <span class="label-description">
                  Maximum number of parallel instances (1-4)
                </span>
              </label>
              <div class="instance-selector">
                <button class="instance-btn active">1</button>
                <button class="instance-btn">2</button>
                <button class="instance-btn">3</button>
                <button class="instance-btn">4</button>
              </div>
            </div>
            
            <div class="setting-group">
              <label class="setting-label">
                <span class="label-text">Auto Instance Mode</span>
                <span class="label-description">
                  Automatically adjust instances based on system resources
                </span>
              </label>
              <div class="toggle-container">
                <button class="toggle-option">Manual</button>
                <button class="toggle-option active">Auto</button>
              </div>
            </div>
            
            <div class="setting-group">
              <label class="setting-label">
                <span class="label-text">Visual Indicators</span>
                <span class="label-description">
                  Show progress bars and color coding
                </span>
              </label>
              <div class="toggle-container">
                <button class="toggle-option">Off</button>
                <button class="toggle-option active">On</button>
              </div>
            </div>
            
            <div class="setting-group">
              <label class="setting-label">
                <span class="label-text">Proof Return Mode</span>
                <span class="label-description">
                  How completed proofs are displayed
                </span>
              </label>
              <div class="toggle-container">
                <button class="toggle-option">Popup</button>
                <button class="toggle-option active">Direct</button>
              </div>
            </div>
          </div>
          
          <div class="settings-footer">
            <button class="btn-save" onClick={handleClose}>Save & Close</button>
          </div>
        </div>
      </div>
      
      <style>{`
        .settings-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          animation: fadeIn 0.2s ease-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .settings-modal {
          background: white;
          border-radius: 20px;
          width: 90%;
          max-width: 600px;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        @keyframes slideUp {
          from {
            transform: translateY(50px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .settings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 2rem;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .settings-header h2 {
          margin: 0;
          font-size: 1.5rem;
          color: #1f2937;
        }
        
        .close-btn {
          width: 32px;
          height: 32px;
          border: none;
          background: #f3f4f6;
          color: #6b7280;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1.25rem;
          transition: all 0.2s;
        }
        
        .close-btn:hover {
          background: #e5e7eb;
          color: #1f2937;
        }
        
        .settings-content {
          padding: 2rem;
        }
        
        .setting-group {
          margin-bottom: 2rem;
        }
        
        .setting-label {
          display: block;
          margin-bottom: 1rem;
        }
        
        .label-text {
          display: block;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.25rem;
        }
        
        .label-description {
          display: block;
          font-size: 0.875rem;
          color: #6b7280;
        }
        
        .instance-selector {
          display: flex;
          gap: 0.5rem;
        }
        
        .instance-btn {
          flex: 1;
          padding: 0.75rem;
          border: 2px solid #e5e7eb;
          background: white;
          border-radius: 8px;
          font-weight: 600;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .instance-btn:hover {
          background: #f9fafb;
          border-color: #3b82f6;
        }
        
        .instance-btn.active {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }
        
        .toggle-container {
          display: flex;
          gap: 0.5rem;
          background: #f3f4f6;
          padding: 0.25rem;
          border-radius: 10px;
        }
        
        .toggle-option {
          flex: 1;
          padding: 0.5rem 1rem;
          border: none;
          background: transparent;
          color: #6b7280;
          font-weight: 500;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .toggle-option:hover {
          color: #1f2937;
        }
        
        .toggle-option.active {
          background: white;
          color: #3b82f6;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .settings-footer {
          padding: 1.5rem 2rem;
          border-top: 1px solid #e5e7eb;
          display: flex;
          justify-content: flex-end;
        }
        
        .btn-save {
          padding: 0.75rem 2rem;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .btn-save:hover {
          background: #2563eb;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }
      `}</style>
    </Show>
  )
}
