# HydraJTS Protocol Settings Guide

## 🎛️ Proof Resolution Settings Interface

The HydraJTS protocol now includes a comprehensive settings interface that allows fine-tuning of the multi-instance behavior.

## Accessing Settings

### Automatic Display on Startup
By default, the settings panel will appear when you first load the application. This can be disabled in the settings themselves.

### Manual Access
Click the **"⚙️ Proof Resolution Settings"** button in the top-right corner of the interface at any time.

## Settings Options

### 1. **Protocol Status** (Enable/Disable)
- **🚫 Disable**: Runs proofs in traditional blocking mode (UI freezes while waiting)
- **✅ Activate**: Enables multi-instance overlay system for parallel proof execution

### 2. **Resolution Layers** (1-3)
Controls how many additional instances can be spawned for parallel proof calls.

- **1 Layer**: Base + 1 additional instance (2 total)
- **2 Layers**: Base + 2 additional instances (3 total)  
- **3 Layers**: Base + 3 additional instances (4 total)

Each layer is called a "resolution layer" because it resolves the blocking issue by creating a new execution context.

### 3. **Proof Return Mode**
How completed proofs are displayed to the user:

- **🗗 Popup Windows**: Proofs open in new browser windows when complete
- **↩ Direct Integration**: Proofs merge directly into the current instance (recommended)

### 4. **Visual Indicators**
Enhanced visual feedback options:

- **Show Progress Bars**: Displays real-time progress for each active proof
- **Color-Coded Layers**: Each resolution layer gets a unique color for easy tracking
- **Show Settings on Startup**: Auto-displays settings panel when app loads

## Color Coding System

When enabled, each resolution layer is assigned a color:
- **Base Layer**: Purple (#667eea)
- **Layer 1**: Pink (#f093fb)
- **Layer 2**: Yellow (#fbbf24)
- **Layer 3**: Green (#34d399)

These colors appear in:
- Progress indicators
- Instance stack visualization
- Floating status badges
- Proof completion notifications

## Progress Indicators

### Main Progress Panel
Shows detailed information for each active proof:
- Proof ID
- Layer assignment
- Elapsed time
- Animated progress bar
- Current status (waiting/processing/returning/completed)

### Floating Badges
Small colored indicators in the top-right showing active proofs at a glance.
- Hover for proof details
- Click to focus on specific proof
- Animated to show activity

## Usage Scenarios

### Development/Testing
```
✅ Protocol: Activated
📊 Layers: 3 (maximum)
🗗 Mode: Direct Integration
📈 Indicators: All enabled
```

### Production (Conservative)
```
✅ Protocol: Activated
📊 Layers: 1-2
🗗 Mode: Direct Integration
📈 Progress Bars: Enabled
🎨 Color Coding: Optional
```

### Debugging
```
🚫 Protocol: Disabled (to test blocking behavior)
OR
✅ Protocol: Activated
🗗 Mode: Popup Windows (to inspect each proof)
📈 All indicators enabled
```

### Low-Resource Environment
```
✅ Protocol: Activated
📊 Layers: 1 (minimal instances)
🗗 Mode: Direct Integration
📈 Indicators: Disabled (reduce UI updates)
```

## Settings Persistence

Settings are automatically saved to browser localStorage and persist across sessions.

### Reset to Defaults
Click "Reset to Defaults" to restore original settings:
- Protocol: Enabled
- Layers: 3
- Mode: Direct Integration
- All indicators: Enabled

### Export/Import (Future Feature)
Settings can be shared between users by exporting/importing the configuration JSON.

## API Integration

The settings can be programmatically accessed:

```javascript
import { useProtocolSettings } from './components/ProtocolSettings'

// In your component
const settings = useProtocolSettings()

// Check if protocol is enabled
if (settings().enabled) {
  // Protocol behavior
} else {
  // Blocking behavior
}

// Access max resolution layers
const maxInstances = settings().maxResolutionLayers + 1
```

## Troubleshooting Settings

### Settings Not Saving
- Check browser localStorage is enabled
- Try different browser/incognito mode
- Clear browser cache and reload

### Visual Indicators Not Showing
- Ensure "Show Progress Bars" is enabled
- Check that protocol is activated
- Verify proofs are actually running

### Popup Windows Blocked
- Allow popups for localhost:3000
- Check browser popup blocker settings
- Try Direct Integration mode instead

### Color Coding Issues
- Enable "Color-Coded Layers" in settings
- Check browser supports CSS gradients
- Try refreshing the page

## Performance Impact

Each setting affects performance differently:

| Setting | CPU Impact | Memory Impact | Network Impact |
|---------|------------|---------------|----------------|
| Protocol Enabled | Medium | High | None |
| More Layers | Low | High | None |
| Popup Mode | Low | Medium | None |
| Progress Bars | Medium | Low | None |
| Color Coding | Low | Low | None |

## Best Practices

1. **Start with defaults** - The default settings are optimized for most use cases
2. **Adjust gradually** - Change one setting at a time to understand impact
3. **Monitor performance** - Watch the Instance Dashboard while adjusting
4. **Use appropriate mode** - Popup mode for debugging, Direct for production
5. **Consider your hardware** - Reduce layers on lower-end machines

## Quick Commands

### Via Browser Console
```javascript
// Check current settings
localStorage.getItem('hydrajts-settings')

// Force reset
localStorage.removeItem('hydrajts-settings')
location.reload()

// Programmatically update
const settings = JSON.parse(localStorage.getItem('hydrajts-settings'))
settings.maxResolutionLayers = 2
localStorage.setItem('hydrajts-settings', JSON.stringify(settings))
```

---

Remember: The settings interface is designed to give you complete control over the HydraJTS protocol behavior. Experiment with different configurations to find what works best for your use case!
