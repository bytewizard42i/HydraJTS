# Midnight Testnet Setup Guide

## Overview
This guide explains how to connect HydraJTS to the official Midnight testnet proof server using Docker.

## Prerequisites
- Docker and Docker Compose installed
- Bun or Node.js runtime
- Access to Midnight testnet (no special permissions required for public testnet)

## Quick Start

### 1. Start the Midnight Proof Server
```bash
# Start the Docker containers
docker compose up -d

# Verify containers are running
docker ps

# Check logs
docker logs hydrajts-proof-server
```

### 2. Configure Environment Variables
Copy the testnet configuration:
```bash
cp .env.testnet .env
```

Optionally edit `.env` to customize:
- `MIDNIGHT_PROOF_SERVER_URL`: URL of the proof server (default: http://localhost:6300)
- `MIDNIGHT_API_KEY`: API key if required for testnet access
- `MAX_CONCURRENT_PROOFS`: Maximum parallel proofs (default: 10)

### 3. Test the Connection
Run the connection test script:
```bash
bun scripts/test-midnight-connection.ts
```

This will verify:
- Health check endpoint
- Circuit compilation
- Proof generation
- Proof verification
- Circuit metadata retrieval

## Docker Configuration

### Services

#### Midnight Proof Server
- **Image**: `ghcr.io/midnight-ntwrk/midnight-proof-server:latest`
- **Ports**: 
  - 6300: Main API port
  - 6301: Metrics port
- **Network**: testnet
- **Volumes**:
  - `./proof-artifacts`: Stores generated proofs
  - `./circuits`: Stores compiled circuits

#### Redis (Optional)
- **Image**: `redis:alpine`
- **Port**: 6379
- **Purpose**: Distributed queue for proof jobs

## API Endpoints

The Midnight proof server exposes the following endpoints:

### Core Endpoints
- `GET /health` - Health check
- `POST /api/v1/prove` - Generate proof
- `POST /api/v1/verify` - Verify proof
- `POST /api/v1/compile` - Compile circuit
- `GET /api/v1/circuits/:id` - Get circuit info

### Metrics
- `GET /metrics` - Prometheus metrics (port 6301)

## Using with HydraJTS

### Basic Usage
```typescript
import { CompactClient } from "./src/proofs/compactClient"

const client = new CompactClient({
  baseUrl: process.env.MIDNIGHT_PROOF_SERVER_URL
})

// Generate a proof
const proof = await client.generateProof({
  circuitId: "my-circuit",
  inputs: {
    // Your circuit inputs
  }
})
```

### With HydraManager
```typescript
import { HydraManager } from "./src/hydra/headManager"

const hydra = new HydraManager({ maxHeads: 4 })

// Spawn multiple proofs in parallel
const result = await hydra.spawnProof({
  id: "proof-1",
  circuitId: "user-credential",
  inputs: data,
  priority: 1
})
```

## Monitoring

### View Logs
```bash
# Proof server logs
docker logs -f hydrajts-proof-server

# Redis logs (if using)
docker logs -f hydrajts-redis
```

### Metrics Dashboard
Access Prometheus metrics at: http://localhost:6301/metrics

Key metrics:
- `proofs_generated_total` - Total proofs generated
- `proof_generation_duration_seconds` - Proof generation time
- `active_proof_jobs` - Currently processing proofs
- `proof_queue_size` - Queued proof requests

## Troubleshooting

### Container Won't Start
1. Check if ports are already in use:
   ```bash
   lsof -i :6300
   lsof -i :6301
   ```

2. Check Docker daemon is running:
   ```bash
   docker info
   ```

3. Pull the latest image:
   ```bash
   docker pull ghcr.io/midnight-ntwrk/midnight-proof-server:latest
   ```

### Connection Refused
1. Verify container is running:
   ```bash
   docker ps | grep hydrajts-proof-server
   ```

2. Check container health:
   ```bash
   docker inspect hydrajts-proof-server | grep -A 10 Health
   ```

3. Test direct connection:
   ```bash
   curl http://localhost:6300/health
   ```

### Proof Generation Fails
1. Check server logs for errors:
   ```bash
   docker logs hydrajts-proof-server --tail 50
   ```

2. Verify circuit is properly compiled
3. Ensure inputs match circuit requirements
4. Check memory/resource limits

## Production Considerations

For production deployment:

1. **Security**:
   - Use HTTPS/TLS for API endpoints
   - Configure API keys and authentication
   - Restrict network access

2. **Performance**:
   - Increase `MAX_CONCURRENT_PROOFS` based on resources
   - Use Redis for distributed queue
   - Configure appropriate resource limits

3. **Monitoring**:
   - Set up Prometheus/Grafana for metrics
   - Configure alerting for failures
   - Implement logging aggregation

## Additional Resources

- [Midnight Documentation](https://docs.midnight.network)
- [Compact Language Guide](https://docs.midnight.network/develop/compact)
- [HydraJTS Repository](https://github.com/bytewizard42i/HydraJTS)

## Support

For issues related to:
- **HydraJTS**: Open an issue on GitHub
- **Midnight Testnet**: Check [docs.midnight.network](https://docs.midnight.network)
- **Docker Setup**: See troubleshooting section above
