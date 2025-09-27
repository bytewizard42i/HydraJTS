/**
 * 3D Settings Button with haptic feedback
 */

import { createSignal } from "solid-js"

interface SettingsButton3DProps {
  onClick: () => void
}

export default function SettingsButton3D(props: SettingsButton3DProps) {
  const [isPressed, setIsPressed] = createSignal(false)
  const [isHovering, setIsHovering] = createSignal(false)
  
  const handleClick = () => {
    // Haptic feedback if available
    if ('vibrate' in navigator) {
      navigator.vibrate(10)
    }
    
    // Visual press effect
    setIsPressed(true)
    setTimeout(() => setIsPressed(false), 150)
    
    // Call the provided onClick handler
    props.onClick()
  }
  
  return (
    <button
      class={`settings-button-3d ${isHovering() ? 'hovering' : ''} ${isPressed() ? 'pressed' : ''}`}
      onClick={handleClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      title="Open Protocol Settings"
    >
      <span class="button-content">
        <span class="icon">⚙️</span>
        <span class="text">Settings</span>
      </span>
      <span class="button-shadow"></span>
      
      <style>{`
        .settings-button-3d {
          position: fixed;
          top: 2rem;
          left: 2rem;
          z-index: 1000;
          padding: 0;
          border: none;
          background: none;
          cursor: pointer;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .button-content {
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          background: linear-gradient(145deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          font-size: 1rem;
          font-weight: 600;
          border-radius: 16px;
          box-shadow: 
            0 10px 25px rgba(37, 99, 235, 0.3),
            0 6px 12px rgba(37, 99, 235, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
          transform: translateY(-6px);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .button-shadow {
          position: absolute;
          top: 6px;
          left: 0;
          right: 0;
          bottom: -6px;
          background: linear-gradient(145deg, #1e40af 0%, #1e3a8a 100%);
          border-radius: 16px;
          z-index: -1;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .icon {
          font-size: 1.25rem;
          display: inline-flex;
          animation: rotate-gear 8s linear infinite;
        }
        
        @keyframes rotate-gear {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .text {
          letter-spacing: 0.025em;
        }
        
        /* Hover State */
        .settings-button-3d.hovering .button-content {
          background: linear-gradient(145deg, #2563eb 0%, #1d4ed8 100%);
          transform: translateY(-8px);
          box-shadow: 
            0 14px 30px rgba(37, 99, 235, 0.4),
            0 8px 16px rgba(37, 99, 235, 0.25),
            inset 0 1px 0 rgba(255, 255, 255, 0.25);
        }
        
        .settings-button-3d.hovering .button-shadow {
          top: 8px;
          background: linear-gradient(145deg, #1e3a8a 0%, #172554 100%);
          opacity: 0.8;
        }
        
        .settings-button-3d.hovering .icon {
          animation-duration: 2s;
        }
        
        /* Pressed State */
        .settings-button-3d.pressed .button-content {
          background: linear-gradient(145deg, #1d4ed8 0%, #1e40af 100%);
          transform: translateY(-2px);
          box-shadow: 
            0 2px 4px rgba(37, 99, 235, 0.2),
            inset 0 1px 2px rgba(0, 0, 0, 0.2);
        }
        
        .settings-button-3d.pressed .button-shadow {
          top: 2px;
          opacity: 0.5;
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .settings-button-3d {
            top: 1rem;
            left: 1rem;
          }
          
          .button-content {
            padding: 0.875rem 1.25rem;
            font-size: 0.9375rem;
          }
        }
        
        /* Accessibility */
        .settings-button-3d:focus-visible .button-content {
          outline: 3px solid rgba(59, 130, 246, 0.5);
          outline-offset: 2px;
        }
        
        /* Smooth spring animation on mount */
        @keyframes spring-in {
          0% {
            transform: scale(0) rotate(-180deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.1) rotate(10deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
        
        .settings-button-3d {
          animation: spring-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
      `}</style>
    </button>
  )
}
