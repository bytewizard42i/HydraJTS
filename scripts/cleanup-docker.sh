#!/bin/bash

echo "🧹 Cleaning up Docker resources for HydraJTS..."

# Remove any mock-related containers (if they exist)
echo "Stopping and removing mock containers..."
docker rm -f hydrajts-proof-server 2>/dev/null || true

# Remove mock Docker images
echo "Removing mock Docker images..."
docker rmi midnight-proof-server:v4 2>/dev/null || true
docker rmi $(docker images -q -f "reference=*mock-proof-server*") 2>/dev/null || true

# Clean up dangling images
echo "Cleaning up dangling images..."
docker image prune -f

echo "✅ Cleanup complete!"
echo ""
echo "To start the official Midnight testnet server:"
echo "  docker compose up -d"
