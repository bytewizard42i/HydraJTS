# 🦑 HydraJTS

> Multi-headed parallel zero-knowledge proof execution for the Midnight blockchain ecosystem

**🚀 [Quick Start Guide](./QUICK_START.md)** - Get running in 60 seconds!  
> **🔧 [Developer Setup](./DEV_SETUP.md)** - Detailed setup instructions

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Built with Bun](https://img.shields.io/badge/Built%20with-Bun-orange)](https://bun.sh)
[![Powered by Effect](https://img.shields.io/badge/Powered%20by-Effect--TS-blue)](https://effect.website)
[![SolidStart](https://img.shields.io/badge/UI-SolidStart-2C4F7C)](https://start.solidjs.com)
[![Midnight](https://img.shields.io/badge/Blockchain-Midnight-purple)](https://midnight.network)

## Overview

HydraJTS brings true concurrency to the Midnight ecosystem by spawning multiple asynchronous "heads" that can generate and verify Zero-Knowledge Proofs (ZKPs) simultaneously. The UI intelligently de-duplicates overlapping elements, ensuring smooth, responsive user experiences even under heavy proof workloads.

**Tagline:** "Multiple ZKProofs at the same time for Midnight."

## Why HydraJTS?

ZKPs are computationally heavy and often create delays in privacy-preserving systems like DIDz. Traditional sequential execution creates bottlenecks. HydraJTS solves this by:

- **Parallelizing ZKP operations** through isolated JS/TS "heads"
- **Keeping the UI responsive** through actor-style concurrency
- **Scaling gracefully** with concurrency limits and backpressure control

## Features

| Feature | Description |
|---------|-------------|
| **Parallel ZKP Heads** | Each proof runs in its own async worker, preventing blocking tasks |
| **UI De-Duplication** | Shared UI elements (like loaders) are rendered only once, no matter how many proofs run |
| **Backpressure System** | Caps concurrent proofs, pausing and warning when limits are reached |
| **Compact Integration** | Built to work seamlessly with Midnight's Compact smart contracts and proof server |
| **Effect-TS Powered** | Leverages functional programming for robust error handling and composability |

## Architecture

```
+--------------------+
| Main JS/TS Thread  | ---> UI remains responsive
+--------------------+
          │
          │ Spawns Hydra Heads
          ▼
+--------------------+      +--------------------+
| Hydra Head #1      | ---> | Shared UI Manager  |
+--------------------+      +--------------------+
          │                        ▲
          │                        │ Reconciles shared objects
          ▼                        │
+--------------------+              │
| Hydra Head #2      | --------------+
+--------------------+
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | Bun (preferred) or Deno |
| **Language** | TypeScript |
| **Framework** | SolidStart |
| **Backend Services** | Effect-TS |
| **Worker System** | Web Workers / worker_threads |
| **Queueing** | Upstash Redis or in-memory |
| **Smart Contracts** | Midnight Compact |
| **Proof Server** | Midnight Proof Server v4 |
| **Deployment** | Netlify (serverless) |

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) installed
- Docker (for proof server)
- Node.js 22+ (fallback)

### Installation

```bash
# Clone the repository
git clone https://github.com/bytewizard42i/HydraJTS.git
cd HydraJTS

# Install dependencies
bun install

# Start the Midnight proof server
docker run -p 6300:6300 midnight-proof-server:v4

# Start development server
bun run dev
```

## Usage Example

```typescript
import { HydraManager } from "./src/hydra/headManager"
import { UISync } from "./src/hydra/uiSync"
import { CompactClient } from "./src/proofs/compactClient"

// Initialize HydraJTS
const hydra = new HydraManager({ 
  maxHeads: 4,
  backpressureThreshold: 3 
})

const uiSync = new UISync()
const compactClient = new CompactClient({
  baseUrl: "http://localhost:6300"
})

// Spawn a proof with UI context
async function verifyCredential(credentialData: any) {
  const headContext = uiSync.createHeadContext("proof-1")
  
  // Show loader (deduplicated if another head shows it)
  await headContext.showLoader()
  
  // Spawn the proof
  const result = await hydra.spawnProof({
    id: "credential-verification",
    circuitId: "user-credential",
    inputs: credentialData
  })
  
  // Update progress
  await headContext.showProgress("verification", 0.5)
  
  // Clean up when done
  await headContext.cleanup()
  
  return result
}
```

## Concurrency Control

HydraJTS includes built-in backpressure messaging to prevent resource exhaustion:

```
⚡ HydraJTS: Multiple proofs running in parallel.
Let's wait a moment for the system to catch up...
```

This ensures stability when too many proofs are spawned simultaneously.

## Project Structure

```
HydraJTS/
│
├── src/
│   ├── hydra/
│   │   ├── headManager.ts      # Manages parallel Hydra heads
│   │   └── uiSync.ts           # UI de-duplication logic
│   │
│   ├── proofs/
│   │   ├── compactClient.ts    # Midnight Compact integration
│   │   └── proofQueue.ts       # Queue and backpressure management
│   │
│   ├── routes/                 # SolidStart routes
│   ├── components/             # UI components
│   └── app.tsx                 # Main application entry
│
├── public/                     # Static assets
├── tests/                      # Test suites
├── package.json
├── tsconfig.json
├── app.config.ts              # SolidStart config
└── README.md
```

## Development

```bash
# Run development server
bun run dev

# Build for production
bun run build

# Start production server
bun run start

# Run tests
bun test

# Type checking
bun run typecheck
```

## API Reference

### HydraManager

```typescript
const hydra = new HydraManager({
  maxHeads: 4,              // Maximum concurrent heads
  queueCapacity: 100,       // Maximum queued jobs
  backpressureThreshold: 3  // When to show warning
})

// Spawn a new proof
await hydra.spawnProof({
  id: string,
  circuitId: string,
  inputs: any
})

// Check job status
const status = await hydra.getJobStatus(jobId)

// Get system status
const stats = hydra.getSystemStatus()
```

### UISync

```typescript
const uiSync = new UISync()

// Create a scoped context for a head
const context = uiSync.createHeadContext(headId)

// Show UI elements (auto-deduplicated)
await context.showLoader()
await context.showProgress(id, 0.75)
await context.showNotification(id, "Proof complete!")

// Clean up when done
await context.cleanup()
```

## Deployment

### Netlify Deployment

```bash
# Build the project
bun run build

# Deploy to Netlify
netlify deploy --prod
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

Apache License 2.0 © EnterpriseZK Labs

See [LICENSE](LICENSE) for full license text.

## Contact

- **Author**: John Santi (bytewizard42i)
- **Email**: hariamoor@proton.me
- **GitHub**: [@bytewizard42i](https://github.com/bytewizard42i)
- **Project**: [HydraJTS](https://github.com/bytewizard42i/HydraJTS)

---

Built with ❤️ for the Midnight ecosystem
