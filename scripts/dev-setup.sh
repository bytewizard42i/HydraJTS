#!/bin/bash

# HydraJTS One-Button Developer Setup
# This script sets up everything needed for HydraJTS development

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ASCII Art Banner
echo -e "${BLUE}"
cat << "EOF"
 _   _           _           _ _____ ____  
| | | |_   _  __| |_ __ __ _| |_   _/ ___| 
| |_| | | | |/ _` | '__/ _` | | | | \___ \ 
|  _  | |_| | (_| | | | (_| | | | |  ___) |
|_| |_|\__, |\__,_|_|  \__,_|_| |_| |____/ 
       |___/                                
       Multi-Headed ZKProof Execution
EOF
echo -e "${NC}"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print step
print_step() {
    echo -e "${GREEN}[✓]${NC} $1"
}

# Function to print error
print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

# Check for Bun
if command_exists bun; then
    print_step "Bun is installed ($(bun --version))"
else
    print_error "Bun is not installed"
    echo "Installing Bun..."
    curl -fsSL https://bun.sh/install | bash
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"
    print_step "Bun installed successfully"
fi

# Check for Docker
if command_exists docker; then
    print_step "Docker is installed ($(docker --version))"
else
    print_error "Docker is not installed"
    echo "Please install Docker from https://docs.docker.com/get-docker/"
    exit 1
fi

# Check for Docker Compose
if command_exists docker-compose || docker compose version >/dev/null 2>&1; then
    print_step "Docker Compose is installed"
else
    print_error "Docker Compose is not installed"
    echo "Please install Docker Compose"
    exit 1
fi

# Check if Docker is running
if docker info >/dev/null 2>&1; then
    print_step "Docker daemon is running"
else
    print_error "Docker daemon is not running"
    echo "Please start Docker and try again"
    exit 1
fi

# Install dependencies
echo -e "\n${BLUE}Installing dependencies...${NC}"
if [ -f "package.json" ]; then
    bun install
    print_step "Dependencies installed"
else
    print_error "package.json not found"
    exit 1
fi

# Create necessary directories
echo -e "\n${BLUE}Setting up directories...${NC}"
mkdir -p proof-artifacts
mkdir -p proof-ui
mkdir -p .env
print_step "Directories created"

# Create .env file if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo -e "\n${BLUE}Creating environment configuration...${NC}"
    cat > .env.local << EOL
# HydraJTS Environment Configuration
MIDNIGHT_PROOF_SERVER_URL=http://localhost:6300
REDIS_URL=redis://localhost:6379
MAX_CONCURRENT_HEADS=4
ENABLE_HYDRA_HEADS=true
LOG_LEVEL=debug
EOL
    print_step "Environment configuration created (.env.local)"
else
    print_step "Environment configuration already exists"
fi

# Pull Docker images
echo -e "\n${BLUE}Pulling Docker images...${NC}"
docker pull redis:alpine
print_step "Redis image pulled"

# Check if Midnight proof server image exists
if docker image inspect midnight-proof-server:v4 >/dev/null 2>&1; then
    print_step "Midnight proof server image found"
else
    print_warning "Midnight proof server image not found"
    echo "Building mock proof server for development..."
    
    # Create a mock Dockerfile for development
    cat > Dockerfile.mock-proof-server << 'EOL'
FROM node:20-alpine
WORKDIR /app
RUN npm init -y && npm install express cors body-parser
COPY mock-proof-server.js .
EXPOSE 6300
CMD ["node", "mock-proof-server.js"]
EOL

    # Create mock proof server
    cat > mock-proof-server.js << 'EOL'
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Mock endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', version: 'mock-v4' });
});

app.post('/generate', async (req, res) => {
  // Simulate proof generation delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  res.json({
    proof: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
    publicInputs: ['0x123', '0x456'],
    verificationKey: '0xVK_' + Date.now().toString(16),
    success: true
  });
});

app.post('/verify', async (req, res) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  res.json({ valid: Math.random() > 0.1 }); // 90% success rate
});

app.post('/compile', async (req, res) => {
  await new Promise(resolve => setTimeout(resolve, 2000));
  res.json({
    provingKey: '0xPK_' + Date.now().toString(16),
    verificationKey: '0xVK_' + Date.now().toString(16)
  });
});

app.get('/circuits/:id', (req, res) => {
  res.json({
    constraints: 10000,
    publicInputs: 2,
    privateInputs: 5,
    gates: 8000
  });
});

const PORT = process.env.PORT || 6300;
app.listen(PORT, () => {
  console.log(`Mock Midnight Proof Server running on port ${PORT}`);
});
EOL

    docker build -f Dockerfile.mock-proof-server -t midnight-proof-server:v4 .
    print_step "Mock proof server image built"
fi

# Start Docker services
echo -e "\n${BLUE}Starting Docker services...${NC}"
docker-compose down 2>/dev/null || true
docker-compose up -d
print_step "Docker services started"

# Wait for services to be healthy
echo -e "\n${BLUE}Waiting for services to be ready...${NC}"
MAX_TRIES=30
TRIES=0

while [ $TRIES -lt $MAX_TRIES ]; do
    if curl -f http://localhost:6300/health >/dev/null 2>&1; then
        print_step "Proof server is ready"
        break
    fi
    TRIES=$((TRIES + 1))
    if [ $TRIES -eq $MAX_TRIES ]; then
        print_error "Proof server failed to start"
        docker-compose logs midnight-proof-server
        exit 1
    fi
    sleep 2
    echo -n "."
done

# Test the connection
echo -e "\n${BLUE}Testing proof server connection...${NC}"
HEALTH_CHECK=$(curl -s http://localhost:6300/health)
if [ $? -eq 0 ]; then
    print_step "Proof server connection successful"
    echo "Response: $HEALTH_CHECK"
else
    print_error "Failed to connect to proof server"
fi

# Start the development server
echo -e "\n${GREEN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}   HydraJTS Development Environment Ready! 🚀${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}Services running:${NC}"
echo "  • Proof Server: http://localhost:6300"
echo "  • Redis:        redis://localhost:6379"
echo "  • UI:           http://localhost:3000 (starting...)"
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo "  • View logs:    docker-compose logs -f"
echo "  • Stop:         docker-compose down"
echo "  • Test:         bun test"
echo "  • Build:        bun run build"
echo ""
echo -e "${GREEN}Starting development server...${NC}"

# Start the dev server
bun run dev
