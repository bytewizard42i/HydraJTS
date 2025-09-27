/**
 * Creepy Old Way Button - A dingy, glitchy button that takes you to the dark past
 */

import { createSignal, onCleanup, onMount } from "solid-js"

export default function CreepyOldWayButton() {
  const [isHovering, setIsHovering] = createSignal(false)
  const [isClicking, setIsClicking] = createSignal(false)
  const [glitchText, setGlitchText] = createSignal("⚠️ Experience the OLD WAY ⚠️")
  
  let audioContext: AudioContext | null = null
  let isPlaying = false
  
  onMount(() => {
    // Initialize Web Audio API
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    } catch (e) {
      console.warn('Web Audio API not supported')
    }
  })
  
  const createOminousSound = () => {
    if (!audioContext || isPlaying) return
    
    isPlaying = true
    
    // Create an ominous, industrial sound
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    const filter = audioContext.createBiquadFilter()
    
    // Connect nodes: oscillator -> filter -> gain -> destination
    oscillator.connect(filter)
    filter.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    // Configure the sound
    oscillator.frequency.setValueAtTime(80, audioContext.currentTime) // Low rumble
    oscillator.type = 'sawtooth' // Industrial sound
    
    // Filter for metallic resonance
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(200, audioContext.currentTime)
    filter.Q.setValueAtTime(10, audioContext.currentTime)
    
    // Volume envelope
    gainNode.gain.setValueAtTime(0, audioContext.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05) // Quick attack - increased volume
    gainNode.gain.exponentialRampToValueAtTime(0.03, audioContext.currentTime + 1.5) // Long decay - increased tail
    
    // Frequency modulation for industrial feel
    oscillator.frequency.setValueAtTime(80, audioContext.currentTime)
    oscillator.frequency.linearRampToValueAtTime(60, audioContext.currentTime + 0.5)
    oscillator.frequency.linearRampToValueAtTime(40, audioContext.currentTime + 1.0)
    
    // Start and stop
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 1.5)
    
    // Reset playing flag after sound ends
    setTimeout(() => {
      isPlaying = false
    }, 1500)
  }
  
  const playOminousSound = () => {
    if (audioContext?.state === 'suspended') {
      audioContext.resume().then(() => {
        createOminousSound()
      })
    } else {
      createOminousSound()
    }
  }
  
  let glitchInterval: any
  
  const startGlitch = () => {
    const glitchMessages = [
      "⚠️ E̸x̷p̵e̶r̴i̷e̴n̸c̴e̷ the OLD WAY ⚠️",
      "⚠️ Ex̴̝̼p̶͉̰e̷̞̲r̵̤͕i̸̱̟e̴͔̺n̷͙̝c̵̘̦e the ŎLD W̷A̴Y̶ ⚠️",
      "⚠️ Ɇ×₱ɆⱤłɆ₦₵Ɇ ŧħɇ ØⱠĐ ₩₳Ɏ ⚠️",
      "⚠️ 3XP3R13NC3 7H3 0LD W4Y ⚠️",
      "⚠️ Experience the OLD WAY ⚠️",
      "⚠️ WARNING: UI WILL FREEZE ⚠️",
      "⚠️ ▓▓▓▓▓▓▓▓ OLD WAY ▓▓▓▓▓▓▓▓ ⚠️",
      "⚠️ D̷O̷N̷'̷T̷ ̷C̷L̷I̷C̷K̷ ̷M̷E̷ ⚠️",
      "⚠️ Experience the ỖḶḊ ẂẠỴ ⚠️"
    ]
    
    glitchInterval = setInterval(() => {
      setGlitchText(glitchMessages[Math.floor(Math.random() * glitchMessages.length)])
    }, 100)
  }
  
  const stopGlitch = () => {
    clearInterval(glitchInterval)
    setGlitchText("⚠️ Experience the OLD WAY ⚠️")
  }
  
  const handleClick = async (e: MouseEvent) => {
    e.preventDefault()
    setIsClicking(true)
    
    // Shorting out effect
    const shortMessages = [
      "⚡ SHORTING OUT ⚡",
      "💥 SYSTEM FAILURE 💥", 
      "🔌 CONNECTION LOST 🔌",
      "⚠️ ERROR ERROR ERROR ⚠️",
      "☠️ BLUE SCREEN INCOMING ☠️",
      "🔥 BURNING CIRCUITS 🔥",
      "⛔ ABANDON HOPE ⛔"
    ]
    
    // Rapid glitch during click
    for (let i = 0; i < 20; i++) {
      setGlitchText(shortMessages[Math.floor(Math.random() * shortMessages.length)])
      await new Promise(resolve => setTimeout(resolve, 50))
    }
    
    // Navigate to old way
    window.location.href = '/old-way'
  }
  
  onCleanup(() => {
    if (glitchInterval) clearInterval(glitchInterval)
  })
  
  return (
    <div class="creepy-button-container">
      <div class="cobwebs"></div>
      <div class="dust-particles"></div>
      
      <button
        class={`creepy-old-way-button ${isHovering() ? 'hovering' : ''} ${isClicking() ? 'shorting' : ''}`}
        onMouseEnter={() => {
          setIsHovering(true)
          startGlitch()
          playOminousSound()
        }}
        onMouseLeave={() => {
          setIsHovering(false)
          stopGlitch()
        }}
        onClick={handleClick}
      >
        <span class="button-text">{glitchText()}</span>
        <span class="rust-stains"></span>
        <span class="cracks"></span>
        <span class="sparks"></span>
      </button>
      
      <div class="warning-signs">
        <span class="warning-left">☠️ DANGER ☠️</span>
        <span class="warning-right">⚡ HIGH VOLTAGE ⚡</span>
      </div>
      
      <style>{`
        .creepy-button-container {
          position: relative;
          margin: 3rem auto;
          padding: 2rem;
          max-width: 600px;
          background: radial-gradient(ellipse at center, 
            rgba(50, 30, 20, 0.3) 0%,
            rgba(20, 10, 5, 0.5) 50%,
            rgba(0, 0, 0, 0.7) 100%
          );
          border-radius: 20px;
          box-shadow: 
            inset 0 0 50px rgba(0, 0, 0, 0.8),
            0 0 20px rgba(139, 69, 19, 0.3);
          
          /* Eroded edges using clip-path */
          clip-path: polygon(
            3% 8%, 15% 3%, 30% 7%, 45% 2%, 60% 6%, 75% 3%, 90% 8%, 97% 4%,
            99% 15%, 96% 30%, 99% 45%, 95% 60%, 98% 75%, 94% 88%, 97% 95%,
            90% 97%, 75% 94%, 60% 98%, 45% 95%, 30% 97%, 15% 93%, 5% 96%,
            2% 85%, 4% 70%, 1% 55%, 3% 40%, 1% 25%, 4% 12%
          );
          
          /* Rust overlay effect */
          position: relative;
          overflow: visible;
        }
        
        .creepy-button-container::before {
          content: '';
          position: absolute;
          top: -5px;
          left: -5px;
          right: -5px;
          bottom: -5px;
          background: 
            radial-gradient(circle at 20% 20%, rgba(139, 69, 19, 0.6) 0%, transparent 30%),
            radial-gradient(circle at 80% 30%, rgba(165, 42, 42, 0.5) 0%, transparent 40%),
            radial-gradient(circle at 30% 70%, rgba(139, 90, 43, 0.6) 0%, transparent 35%),
            radial-gradient(circle at 70% 80%, rgba(101, 67, 33, 0.5) 0%, transparent 45%),
            radial-gradient(circle at 50% 50%, rgba(139, 69, 19, 0.4) 0%, transparent 60%);
          filter: blur(3px);
          z-index: -1;
          animation: rust-spread 10s ease-in-out infinite;
        }
        
        @keyframes rust-spread {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
        
        .cobwebs {
          position: absolute;
          top: -10px;
          right: -10px;
          width: 60px;
          height: 60px;
          background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M10,10 Q50,30 90,10 M30,10 Q50,40 70,10 M50,10 Q50,50 50,10' stroke='rgba(255,255,255,0.1)' fill='none'/%3E%3C/svg%3E") no-repeat;
          opacity: 0.6;
          pointer-events: none;
        }
        
        .dust-particles {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: 
            radial-gradient(1px 1px at 20% 30%, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            radial-gradient(1px 1px at 60% 70%, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            radial-gradient(1px 1px at 80% 10%, rgba(255, 255, 255, 0.08) 1px, transparent 1px);
          background-size: 50px 50px;
          animation: float-dust 20s infinite linear;
          pointer-events: none;
        }
        
        @keyframes float-dust {
          from { transform: translateY(0); }
          to { transform: translateY(-50px); }
        }
        
        .creepy-old-way-button {
          position: relative;
          width: 100%;
          padding: 1.5rem 2rem;
          font-size: 1.3rem;
          font-weight: 900;
          font-family: 'Courier New', monospace;
          background: linear-gradient(145deg, 
            #4a4a4a 0%, 
            #2a2a2a 40%, 
            #1a1a1a 60%,
            #0a0a0a 100%
          );
          color: #ff3333;
          text-shadow: 
            0 0 5px rgba(255, 0, 0, 0.5),
            0 0 10px rgba(255, 0, 0, 0.3),
            2px 2px 2px rgba(0, 0, 0, 0.8);
          border: 3px solid #333;
          border-radius: 10px;
          cursor: pointer;
          box-shadow: 
            inset 0 0 20px rgba(139, 69, 19, 0.3),
            inset 0 -5px 10px rgba(0, 0, 0, 0.5),
            0 5px 10px rgba(0, 0, 0, 0.8),
            0 0 30px rgba(255, 0, 0, 0.1);
          transition: all 0.3s;
          overflow: hidden;
          transform: perspective(1000px) rotateX(2deg);
        }
        
        .button-text {
          position: relative;
          z-index: 2;
          display: block;
          letter-spacing: 2px;
        }
        
        .rust-stains {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(ellipse at 20% 30%, rgba(139, 69, 19, 0.4) 0%, transparent 40%),
            radial-gradient(ellipse at 80% 70%, rgba(165, 42, 42, 0.3) 0%, transparent 40%),
            radial-gradient(ellipse at 50% 90%, rgba(139, 90, 43, 0.3) 0%, transparent 40%);
          pointer-events: none;
        }
        
        .cracks {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M20,50 L35,45 L50,55 L65,48 L80,52' stroke='rgba(0,0,0,0.3)' fill='none' stroke-width='0.5'/%3E%3C/svg%3E") no-repeat center;
          background-size: cover;
          opacity: 0.6;
          pointer-events: none;
        }
        
        .sparks {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100%;
          height: 100%;
          opacity: 0;
          pointer-events: none;
        }
        
        .creepy-old-way-button.hovering {
          animation: shake 0.2s infinite;
          box-shadow: 
            inset 0 0 30px rgba(255, 0, 0, 0.5),
            inset 0 -5px 10px rgba(0, 0, 0, 0.5),
            0 5px 15px rgba(0, 0, 0, 0.9),
            0 0 50px rgba(255, 0, 0, 0.3);
        }
        
        .creepy-old-way-button.hovering .button-text {
          animation: glitch-text 0.3s infinite;
        }
        
        @keyframes shake {
          0%, 100% { transform: perspective(1000px) rotateX(2deg) translateX(0); }
          25% { transform: perspective(1000px) rotateX(2deg) translateX(-2px) rotateY(-1deg); }
          50% { transform: perspective(1000px) rotateX(2deg) translateX(2px) rotateY(1deg); }
          75% { transform: perspective(1000px) rotateX(2deg) translateX(-1px) rotateY(-0.5deg); }
        }
        
        @keyframes glitch-text {
          0%, 100% { 
            text-shadow: 
              0 0 5px rgba(255, 0, 0, 0.5),
              0 0 10px rgba(255, 0, 0, 0.3),
              2px 2px 2px rgba(0, 0, 0, 0.8);
          }
          25% { 
            text-shadow: 
              -2px 0 #00ff00,
              2px 2px #ff00ff,
              0 0 10px rgba(255, 0, 0, 0.5);
          }
          50% {
            text-shadow: 
              2px 0 #00ffff,
              -2px -2px #ffff00,
              0 0 20px rgba(255, 0, 0, 0.7);
          }
          75% {
            text-shadow: 
              -1px 0 #ff00ff,
              1px 1px #00ff00,
              0 0 15px rgba(255, 0, 0, 0.6);
          }
        }
        
        .creepy-old-way-button.shorting {
          animation: short-circuit 0.1s infinite;
          background: linear-gradient(145deg,
            #ff0000 0%,
            #000000 20%,
            #ffff00 40%,
            #000000 60%,
            #00ffff 80%,
            #000000 100%
          );
        }
        
        .creepy-old-way-button.shorting .sparks {
          opacity: 1;
          animation: electric-spark 0.2s infinite;
        }
        
        @keyframes short-circuit {
          0% { filter: brightness(2) contrast(2); transform: scale(1) rotate(0deg); }
          25% { filter: brightness(0.5) contrast(0.5); transform: scale(1.05) rotate(1deg); }
          50% { filter: brightness(3) contrast(3) hue-rotate(180deg); transform: scale(0.95) rotate(-1deg); }
          75% { filter: brightness(0.2) contrast(0.2); transform: scale(1.02) rotate(0.5deg); }
          100% { filter: brightness(1.5) contrast(1.5) hue-rotate(360deg); transform: scale(1) rotate(0deg); }
        }
        
        @keyframes electric-spark {
          0%, 100% { 
            box-shadow: 
              inset 0 0 50px #ffff00,
              inset 20px 0 80px #00ffff,
              inset -20px 0 80px #ff00ff,
              0 0 50px #ffffff;
          }
          50% {
            box-shadow: 
              inset 0 0 100px #ffffff,
              inset 20px 0 120px #ffff00,
              inset -20px 0 120px #00ffff,
              0 0 100px #ff00ff;
          }
        }
        
        .warning-signs {
          display: flex;
          justify-content: space-between;
          margin-top: 1rem;
          font-size: 0.8rem;
          color: #ffaa00;
          font-family: 'Courier New', monospace;
          text-transform: uppercase;
          opacity: 0.7;
        }
        
        .warning-left, .warning-right {
          animation: blink-warning 2s infinite;
        }
        
        @keyframes blink-warning {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; color: #ff3333; }
        }
        
        .creepy-old-way-button:active {
          transform: perspective(1000px) rotateX(5deg) translateY(2px);
        }
      `}</style>
    </div>
  )
}
