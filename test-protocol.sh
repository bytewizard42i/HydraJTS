#!/bin/bash

# HydraJTS Protocol Quick Test Script

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}        HydraJTS Protocol Test Script                   ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"

echo -e "\n${YELLOW}Step 1: Checking Docker services...${NC}"
docker-compose ps

echo -e "\n${YELLOW}Step 2: Testing Proof Server Health...${NC}"
HEALTH=$(curl -s http://localhost:6300/health)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Proof server is healthy: $HEALTH${NC}"
else
    echo -e "❌ Proof server is not responding"
    exit 1
fi

echo -e "\n${YELLOW}Step 3: Testing Proof Generation...${NC}"
PROOF=$(curl -s -X POST http://localhost:6300/generate \
  -H "Content-Type: application/json" \
  -d '{"circuitId":"test","inputs":{"data":"test"}}' | jq -r '.proof' | cut -c1-20)

if [ ! -z "$PROOF" ]; then
    echo -e "${GREEN}✓ Proof generated successfully: ${PROOF}...${NC}"
else
    echo -e "❌ Failed to generate proof"
fi

echo -e "\n${YELLOW}Step 4: Dev Server Status...${NC}"
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Dev server is running at http://localhost:3000${NC}"
else
    echo -e "⚠️  Dev server might not be running. Start with: bun run dev"
fi

echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Protocol Test Complete!${NC}"
echo -e "\n${YELLOW}To test the full protocol:${NC}"
echo "1. Open http://localhost:3000 in your browser"
echo "2. Click 'Call Proof' button multiple times"
echo "3. Watch instances stack up in the visualization"
echo "4. Click 'Demo Protocol' for automatic demonstration"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
