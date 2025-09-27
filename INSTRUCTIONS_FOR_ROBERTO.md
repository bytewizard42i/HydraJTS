# HydraJTS Protocol - Instructions for Roberto

## Quick Start Guide

Hey Roberto! Here's everything you need to know to run and understand the HydraJTS protocol.

## 🚀 Getting Started

### 1. SSH into the Server
```bash
ssh [your-user]@[server-ip]
cd /home/js/utils_Midnight/utils_HydraJTS
```

### 2. Start the Protocol (One Command)
```bash
# This starts both Docker services and the dev server
./scripts/dev-setup.sh
```

Or if you want to do it step by step:

```bash
# Step 1: Start Docker services (proof server + redis)
docker-compose up -d

# Step 2: Check if services are running
docker ps
curl http://localhost:6300/health

# Step 3: Install dependencies
bun install

# Step 4: Start the development server
bun run dev
```

## 🐙 Understanding the Protocol

### How HydraJTS Works

The protocol creates **multiple JavaScript instances** that overlay each other, like multiple browser tabs running simultaneously but sharing state intelligently. Here's the flow:

1. **Normal Program Flow**: User interacts with the app normally
2. **Proof Request**: When a proof is called:
   - Current instance **freezes** (waits for proof)
   - New instance **spawns on top** (user can continue working)
   - Duplicate UI elements are **cancelled out** 
3. **Multiple Proofs**: Up to 4 instances can run at once (configurable cap)
4. **Proof Returns**: When proofs complete:
   - They queue up in order
   - Integrate back into the active instance
   - Frozen instances are cleaned up

### Visual Explanation
```
Instance 1: [Running] → [Proof Called] → [FROZEN - Waiting for Proof]
                              ↓
Instance 2: [Spawned] → [Running - User continues] → [Another Proof] → [FROZEN]
                                                            ↓
Instance 3: [Spawned] → [Running - User continues]
                              ↓
            When Proof 1 returns → Merges into Instance 3
            When Proof 2 returns → Merges into Instance 3
```

## 📁 Key Files and Components

### Core Protocol Files
- `/src/hydra/instanceManager.ts` - Manages the multi-instance overlay system
- `/src/components/HydraProtocol.tsx` - Main UI component showing the protocol in action
- `/src/components/ProofServerStatus.tsx` - Connection status to proof server

### Configuration
- `docker-compose.yml` - Docker services configuration
- `.env.testnet` - Environment variables (copy to `.env.local` if needed)
- `package.json` - Project dependencies and scripts

## 🖥️ Testing the Protocol

### Access the UI
Open your browser to: `http://localhost:3000`

### Test the Multi-Instance Behavior

1. **Click "Call Proof"** - Creates a new instance and calls a proof
2. **Click it multiple times quickly** - See multiple instances stack up
3. **Click "Demo Protocol"** - Automatically demonstrates the behavior
4. Watch the Instance Stack Visualization to see instances overlay

### What You Should See:
- **Instance Dashboard**: Shows current active/frozen instances
- **Visual Stack**: Shows instances layered on top of each other
- **Proof Jobs**: List of all proofs being processed
- **Backpressure Warning**: When hitting the 4-instance cap

## 🔧 Troubleshooting

### Issue: "Cannot connect to proof server"
```bash
# Check if Docker is running
docker ps

# Check proof server logs
docker logs hydrajts-proof-server

# Restart services
docker-compose down
docker-compose up -d
```

### Issue: "Docker daemon not running"
```bash
# Start Docker service
sudo systemctl start docker

# Or if using Docker Desktop
# Make sure Docker Desktop is running

# Switch Docker context if needed
docker context use default
```

### Issue: "Port already in use"
```bash
# Find what's using port 6300
lsof -i :6300

# Kill the process or change the port in docker-compose.yml
```

### Issue: "GUI runs but nothing happens after connect"
This is exactly what the new protocol fixes! The instance manager now:
- Creates overlays automatically when proofs are called
- Doesn't require a manual "connect" button
- Handles proof returns asynchronously
- Shows visual feedback for all state changes

### Check Service Health
```bash
# Proof server health
curl http://localhost:6300/health

# Redis connection
redis-cli ping

# View all logs
docker-compose logs -f
```

## 🎮 Protocol Controls

### Instance Cap Settings
Edit `/src/hydra/instanceManager.ts`:
```typescript
// Change max instances (default is 4)
export const hydraInstances = new InstanceManager({ maxInstances: 4 })
```

### Disable Protocol (Use Traditional Blocking)
The protocol can be disabled by not creating new instances when proofs are called.

## 📊 Monitoring

### Real-time Status
The UI shows:
- Active instances count
- Frozen instances (waiting for proofs)
- Queued proof returns
- Visual stack representation

### Logs
```bash
# Watch Docker logs
docker-compose logs -f midnight-proof-server

# Watch app logs (in dev server terminal)
# Shows instance creation, proof returns, merges
```

## 🤝 Testing with Real Midnight Network

When ready to test with real Midnight testnet:

1. Update `docker-compose.yml` to use official image:
```yaml
image: ghcr.io/midnight-ntwrk/midnight-proof-server:latest
```

2. Update `.env.testnet` with real endpoints
3. Ensure you have testnet access credentials

## 💡 Understanding the Code Flow

1. **User Action** → Triggers proof request
2. **InstanceManager.createInstance()** → Freezes current, creates overlay
3. **Mock/Real Proof Server** → Processes proof (2-5 seconds)
4. **handleProofReturn()** → Queues the returned proof
5. **processProofQueue()** → Merges proof back into active instance
6. **UI Updates** → Shows completed proof in current context

## 🐛 Debug Mode

To see detailed logs:
```bash
# Set log level in environment
export LOG_LEVEL=debug

# Or add console.logs in instanceManager.ts
# All instance operations are logged with [HydraJTS] prefix
```

## 📞 Need Help?

If something isn't working:
1. Check the browser console (F12) for errors
2. Check Docker logs: `docker-compose logs`
3. Check the terminal running `bun run dev`
4. Look for `[HydraJTS]` prefixed messages in console

The protocol is designed to be transparent - you'll see messages for:
- Instance creation
- Proof calls
- Proof returns
- Instance merges
- Capacity warnings

## 🎯 Key Points to Remember

1. **It's NOT about the proof server** - The proof server handles multiple calls fine
2. **It's about the JavaScript instances** - Like overlapping browser contexts
3. **Instances are frozen, not blocked** - They wait while new ones take over
4. **Cap of 4 is configurable** - Prevents memory issues
5. **Proofs queue for integration** - Return in order to active instance

---

Let me know if you need any clarification or run into issues! The protocol should now work as we discussed - creating JavaScript instance overlays that allow the program to continue while waiting for proofs.

-JS
