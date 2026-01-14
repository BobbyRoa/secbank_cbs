#!/bin/bash
# Secbank CBS - Docker Image Build Script
# Run this script to build and export Docker images

set -e

echo "============================================"
echo "Secbank CBS - Docker Image Builder"
echo "============================================"

# Navigate to project root
cd "$(dirname "$0")/.."

# Build backend image
echo ""
echo "[1/3] Building backend image..."
docker build -t secbank-backend:latest -f docker/backend/Dockerfile .
echo "✓ Backend image built successfully"

# Build frontend image
echo ""
echo "[2/3] Building frontend image..."
docker build -t secbank-frontend:latest -f docker/frontend/Dockerfile .
echo "✓ Frontend image built successfully"

# Export images to tar files
echo ""
echo "[3/3] Exporting images to tar files..."
mkdir -p docker/images

docker save secbank-backend:latest | gzip > docker/images/secbank-backend.tar.gz
echo "✓ Backend image exported to docker/images/secbank-backend.tar.gz"

docker save secbank-frontend:latest | gzip > docker/images/secbank-frontend.tar.gz
echo "✓ Frontend image exported to docker/images/secbank-frontend.tar.gz"

echo ""
echo "============================================"
echo "Build Complete!"
echo "============================================"
echo ""
echo "Images created:"
ls -lh docker/images/
echo ""
echo "To load images on another machine:"
echo "  docker load < docker/images/secbank-backend.tar.gz"
echo "  docker load < docker/images/secbank-frontend.tar.gz"
echo ""
echo "To push to AWS ECR:"
echo "  aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <account>.dkr.ecr.<region>.amazonaws.com"
echo "  docker tag secbank-backend:latest <account>.dkr.ecr.<region>.amazonaws.com/secbank-backend:latest"
echo "  docker push <account>.dkr.ecr.<region>.amazonaws.com/secbank-backend:latest"
