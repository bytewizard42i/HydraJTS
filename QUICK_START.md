# ⚡ HydraJTS Quick Start Guide

## 🚀 Get Started in 60 Seconds

### Prerequisites
- **Bun** installed (`curl -fsSL https://bun.sh/install | bash`)
- **Docker** installed and running
- **Git** installed

### Step 1: Clone & Enter
```bash
git clone https://github.com/bytewizard42i/HydraJTS.git
cd HydraJTS
```

### Step 2: One-Button Setup
```bash
bun run dev:full
```

**That's it!** 🎉 Everything is now running:
- ✅ Mock Proof Server at http://localhost:6300
- ✅ Redis Queue at redis://localhost:6379
- ✅ HydraJTS UI at http://localhost:3000

## 🎯 What Just Happened?

The `dev:full` command automatically:
1. Checked all prerequisites
2. Installed dependencies
3. Built the Docker images
4. Started the proof server
5. Started Redis
6. Launched the dev server
7. Opened your browser

## 🧪 Test It Out

### 1. Check Services Health
```bash
# Proof server health
curl http://localhost:6300/health

# View Docker status
docker-compose ps

# Run tests
bun test simple.test.ts
```

### 2. Try the Demo
1. Open http://localhost:3000
2. Click "Spawn Proof" multiple times
3. Watch parallel proof generation
4. Notice the backpressure warnings when at capacity

### 3. Generate a Test Proof
```bash
curl -X POST http://localhost:6300/generate \
  -H "Content-Type: application/json" \
  -d '{"circuitId": "test", "inputs": {"value": 42}}'
```

## 📚 Available Commands

| Command | Description |
|---------|-------------|
| `bun run dev` | Start dev server only |
| `bun run dev:full` | Complete setup + start everything |
| `bun run dev:docker` | Start Docker + dev server |
| `bun run docker:up` | Start Docker services |
| `bun run docker:down` | Stop Docker services |
| `bun run docker:logs` | View Docker logs |
| `bun test` | Run all tests |
| `bun run build` | Build for production |

## 🏗️ Project Structure

```
HydraJTS/
├── src/
│   ├── hydra/           # Core Hydra system
│   │   ├── headManager.ts    # Manages worker threads
│   │   ├── uiSync.ts         # UI deduplication
│   │   └── proofWorker.js    # Worker thread script
│   ├── proofs/          # Proof handling
│   │   ├── compactClient.ts  # Midnight integration
│   │   └── proofQueue.ts     # Queue management
│   └── components/      # UI components
│       ├── HydraDemo.tsx     # Main demo
│       └── ProofServerStatus.tsx # Connection monitor
├── docker-compose.yml   # Service orchestration
├── mock-proof-server.js # Development server
└── scripts/
    └── dev-setup.sh    # One-button setup script
```

## 🔧 Configuration

### Environment Variables
Create `.env.local`:
```env
MIDNIGHT_PROOF_SERVER_URL=http://localhost:6300
REDIS_URL=redis://localhost:6379
MAX_CONCURRENT_HEADS=4
LOG_LEVEL=debug
```

### Adjust Concurrency
In `src/routes/index.tsx`:
```typescript
const hydra = new HydraManager({ 
  maxHeads: 8  // Increase for more parallelism
})
```

## 🐛 Troubleshooting

### Docker Not Running?
```bash
# macOS
open -a Docker

# Linux
sudo systemctl start docker
```

### Port Already in Use?
```bash
# Find and kill process
lsof -i :6300
kill -9 <PID>
```

### Clean Restart
```bash
docker-compose down -v
rm -rf node_modules
bun install
bun run dev:full
```

## 🚢 Production Deployment

### 1. Update Environment
```env
MIDNIGHT_PROOF_SERVER_URL=https://proof.midnight.network
MIDNIGHT_API_KEY=your-production-key
```

### 2. Build & Deploy
```bash
bun run build
netlify deploy --prod
```

## 📖 Learn More

- **[DEV_SETUP.md](./DEV_SETUP.md)** - Detailed setup guide
- **[README.md](./README.md)** - Full documentation
- **[forAlice.md](./forAlice.md)** - Implementation notes
- **[AI-chat.md](./AI-chat.md)** - Development history

## 💬 Support

- **Issues**: [GitHub Issues](https://github.com/bytewizard42i/HydraJTS/issues)
- **Author**: John Santi (bytewizard42i)
- **Email**: hariamoor@proton.me

---

**Remember**: Just run `bun run dev:full` and everything works! 🎉

*HydraJTS - Making ZKProofs parallel, simple, and fast.*
