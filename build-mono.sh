#!/bin/bash

# YOLO Check-In Platform - Mono Docker Build Script
# This script helps build and test the mono Docker image locally

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

DOCKER_IMAGE="yolo-checkin:latest"
CONTAINER_NAME="yolo-checkin-test"

echo "=========================================="
echo "YOLO Check-In Mono Docker Build Script"
echo "=========================================="

# Parse command line arguments
BUILD_ONLY=false
TEST_ONLY=false
PLATFORM=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --build-only)
            BUILD_ONLY=true
            shift
            ;;
        --test-only)
            TEST_ONLY=true
            shift
            ;;
        --platform)
            PLATFORM="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --build-only       Only build the image, don't test"
            echo "  --test-only        Only test existing image, don't build"
            echo "  --platform ARCH    Build for specific platform (linux/amd64 or linux/arm64)"
            echo "  --help             Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                           # Build and test"
            echo "  $0 --build-only              # Only build"
            echo "  $0 --platform linux/arm64    # Build for ARM64"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Build the image
if [ "$TEST_ONLY" = false ]; then
    echo ""
    echo "Building Docker image..."
    echo "Image: $DOCKER_IMAGE"
    
    BUILD_ARGS=""
    if [ -n "$PLATFORM" ]; then
        echo "Platform: $PLATFORM"
        BUILD_ARGS="--platform $PLATFORM"
    fi
    
    docker build $BUILD_ARGS -t "$DOCKER_IMAGE" -f Dockerfile.mono .
    
    if [ $? -eq 0 ]; then
        echo "✓ Build successful!"
    else
        echo "✗ Build failed!"
        exit 1
    fi
fi

# Test the image
if [ "$BUILD_ONLY" = false ]; then
    echo ""
    echo "Testing the image..."
    
    # Stop and remove existing test container if it exists
    echo "Cleaning up any existing test container..."
    docker stop "$CONTAINER_NAME" 2>/dev/null || true
    docker rm "$CONTAINER_NAME" 2>/dev/null || true
    
    # Start the container
    echo "Starting container..."
    docker run -d \
        --name "$CONTAINER_NAME" \
        -p 8080:80 \
        -e POSTGRES_USER=testuser \
        -e POSTGRES_PASSWORD=testpass \
        -e POSTGRES_DB=testdb \
        -e SECRET_KEY=test-secret-key-$(openssl rand -hex 16) \
        "$DOCKER_IMAGE"
    
    echo "Container started. Waiting for services to be ready..."
    
    # Wait for services to start
    MAX_WAIT=60
    WAIT_TIME=0
    
    while [ $WAIT_TIME -lt $MAX_WAIT ]; do
        if docker exec "$CONTAINER_NAME" curl -s http://localhost/health > /dev/null 2>&1; then
            echo "✓ Services are ready!"
            break
        fi
        echo "Waiting... ($WAIT_TIME/$MAX_WAIT seconds)"
        sleep 5
        WAIT_TIME=$((WAIT_TIME + 5))
    done
    
    if [ $WAIT_TIME -ge $MAX_WAIT ]; then
        echo "✗ Services failed to start within $MAX_WAIT seconds"
        echo ""
        echo "Container logs:"
        docker logs "$CONTAINER_NAME"
        docker stop "$CONTAINER_NAME"
        docker rm "$CONTAINER_NAME"
        exit 1
    fi
    
    # Test the endpoints
    echo ""
    echo "Testing endpoints..."
    
    # Test health endpoint
    if docker exec "$CONTAINER_NAME" curl -s http://localhost/health | grep -q "healthy"; then
        echo "✓ Health endpoint OK"
    else
        echo "✗ Health endpoint failed"
    fi
    
    # Test API docs
    if docker exec "$CONTAINER_NAME" curl -s http://localhost/docs | grep -q "html"; then
        echo "✓ API docs endpoint OK"
    else
        echo "✗ API docs endpoint failed"
    fi
    
    # Test frontend
    if docker exec "$CONTAINER_NAME" curl -s http://localhost/ | grep -q "html\|DOCTYPE"; then
        echo "✓ Frontend endpoint OK"
    else
        echo "✗ Frontend endpoint failed"
    fi
    
    echo ""
    echo "=========================================="
    echo "Test Summary"
    echo "=========================================="
    echo "Container is running and accessible at:"
    echo "  - Application: http://localhost:8080"
    echo "  - API Docs: http://localhost:8080/docs"
    echo ""
    echo "Container name: $CONTAINER_NAME"
    echo ""
    echo "To view logs:"
    echo "  docker logs $CONTAINER_NAME"
    echo ""
    echo "To stop and remove the test container:"
    echo "  docker stop $CONTAINER_NAME && docker rm $CONTAINER_NAME"
    echo ""
fi

echo "Done!"
