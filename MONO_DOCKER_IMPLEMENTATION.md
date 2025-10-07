# Mono Docker Image Implementation Summary

## Overview

This implementation provides a **single Docker image** containing the entire YOLO Check-In Platform stack:
- ✅ Frontend (Next.js - production build)
- ✅ Backend (FastAPI)
- ✅ PostgreSQL database
- ✅ Nginx reverse proxy
- ✅ Multi-architecture support (AMD64 + ARM64)
- ✅ CI/CD with GitHub Actions
- ✅ Single environment file configuration

## Architecture

```
┌─────────────────────────────────────────────┐
│           Docker Container                  │
│                                             │
│  ┌────────────────────────────────────┐    │
│  │      Nginx :80 (Reverse Proxy)     │    │
│  └──┬──────────────────────────────┬──┘    │
│     │                              │        │
│  ┌──▼────────────┐      ┌─────────▼────┐   │
│  │   Backend     │      │   Frontend   │   │
│  │   :8000       │      │   :3000      │   │
│  │   (FastAPI)   │      │   (Next.js)  │   │
│  └───────┬───────┘      └──────────────┘   │
│          │                                  │
│  ┌───────▼────────┐                        │
│  │  PostgreSQL    │                        │
│  │    :5432       │                        │
│  └────────────────┘                        │
│                                             │
└─────────────────────────────────────────────┘
         Exposed: Port 80, 5432
```

## Key Files

### 1. Dockerfile.mono
Multi-stage build with:
- **Stage 1**: Build Next.js frontend (production optimized)
- **Stage 2**: Prepare Python dependencies
- **Stage 3**: Final image with all components

### 2. docker-compose.mono.yml
Simple compose file for easy deployment with volume management.

### 3. Init Script (docker/mono/init.sh)
Startup script that:
- Initializes PostgreSQL
- Creates database and user
- Configures environment variables
- Starts all services via supervisord

### 4. Supervisor Configuration (docker/mono/supervisord.conf)
Manages multiple processes:
- Backend (FastAPI/Uvicorn)
- Frontend (Next.js)
- Nginx (reverse proxy)

### 5. Nginx Configuration (docker/mono/nginx.conf)
Routes requests:
- `/api/*` → Backend
- `/docs`, `/redoc` → Backend API docs
- `/uploads/*` → Static files
- `/` → Frontend

### 6. GitHub Actions Workflow (.github/workflows/build-mono-image.yml)
Automated CI/CD:
- Triggers on push to main/develop or tags
- Builds for linux/amd64 and linux/arm64
- Pushes to GitHub Container Registry
- Creates attestations

### 7. Build Script (build-mono.sh)
Helper script for local building and testing with options:
- `--build-only` - Only build
- `--test-only` - Only test
- `--platform` - Build for specific architecture

## Configuration

### Single Environment File

All configuration through environment variables:

```env
# Database
POSTGRES_USER=yolouser
POSTGRES_PASSWORD=yolopass
POSTGRES_DB=yolodb

# Security
SECRET_KEY=your-secret-key-here

# API
API_V1_STR=/api/v1

# Storage
UPLOAD_DIR=/app/uploads
MODEL_DIR=/app/models
DATASET_DIR=/app/datasets
```

The `init.sh` script automatically:
1. Creates database and user from POSTGRES_* variables
2. Generates DATABASE_URL
3. Configures backend .env file
4. Sets up frontend environment

## Deployment Options

### Option 1: Docker Compose (Recommended)
```bash
docker pull ghcr.io/np2023v2/yolo-checkin:latest
docker-compose -f docker-compose.mono.yml up -d
```

### Option 2: Docker Run
```bash
docker run -d \
  --name yolo-checkin \
  -p 80:80 \
  -e POSTGRES_USER=yolouser \
  -e POSTGRES_PASSWORD=yolopass \
  -e POSTGRES_DB=yolodb \
  -e SECRET_KEY=your-secret-key \
  -v yolo-postgres:/var/lib/postgresql/data \
  -v yolo-uploads:/app/uploads \
  ghcr.io/np2023v2/yolo-checkin:latest
```

### Option 3: Build Locally
```bash
./build-mono.sh
```

## Multi-Architecture Support

The image is built for both architectures simultaneously:

**AMD64 (x86_64)**
- Intel/AMD processors
- Most cloud providers
- Development machines

**ARM64 (aarch64)**
- Raspberry Pi 4/5
- AWS Graviton instances
- Apple Silicon (M1/M2/M3)
- Oracle Cloud Ampere

Docker automatically pulls the correct architecture.

## CI/CD Pipeline

### Workflow Triggers
- Push to `main` or `develop` branches
- Push tags starting with `v*` (e.g., v1.0.0)
- Manual workflow dispatch
- Pull requests (build only, no push)

### Build Process
1. Checkout code
2. Set up QEMU (for cross-platform builds)
3. Set up Docker Buildx
4. Login to GitHub Container Registry
5. Extract metadata (tags, labels)
6. Build and push multi-arch image
7. Generate attestation

### Image Tags
- `latest` - Latest main branch build
- `develop` - Latest develop branch build
- `v1.0.0` - Semantic version tags
- `v1.0` - Major.minor tags
- `v1` - Major version tags
- `main-abc1234` - Branch with commit SHA

## Security Features

✅ Minimal base images (Alpine, Slim)  
✅ Non-root user where possible  
✅ Health checks included  
✅ Security headers in Nginx  
✅ Environment-based secrets  
✅ No hardcoded credentials  
✅ Volume isolation  

## Performance Optimizations

✅ Multi-stage builds (smaller image)  
✅ Build cache optimization  
✅ Production Next.js build  
✅ Nginx gzip compression  
✅ Layer caching in CI/CD  
✅ Minimal dependencies  

## Data Persistence

Four volumes for persistent data:
- `postgres_data` - Database files
- `uploads_data` - Uploaded images
- `models_data` - Trained models
- `datasets_data` - Dataset files

## Health Checks

Built-in health check:
```bash
curl http://localhost/health
```

Checks every 30 seconds, 60 second startup time.

## Monitoring and Logs

### View Logs
```bash
# Container logs
docker logs yolo-checkin-mono

# Individual service logs
docker exec yolo-checkin-mono tail -f /var/log/backend.out.log
docker exec yolo-checkin-mono tail -f /var/log/frontend.out.log
docker exec yolo-checkin-mono tail -f /var/log/nginx/access.log
```

### Check Service Status
```bash
docker exec yolo-checkin-mono supervisorctl status
```

## Deployment Examples

### 1. Production with SSL/TLS
See: `examples/deployment/production-ssl.md`
- Nginx reverse proxy with SSL
- Let's Encrypt certificates
- Security headers
- Resource limits

### 2. ARM64 Deployment
See: `examples/deployment/arm64-deployment.md`
- Raspberry Pi setup
- AWS Graviton deployment
- Performance tuning
- Backup strategies

## Testing

Automated validation:
```bash
./build-mono.sh
```

This script:
1. Builds the image
2. Starts a test container
3. Waits for services to be ready
4. Tests endpoints:
   - Health check
   - API documentation
   - Frontend
5. Provides cleanup commands

## Advantages of Mono Image

✅ **Simplicity** - One container to manage  
✅ **Portability** - Easy to move/deploy  
✅ **Consistency** - Same environment everywhere  
✅ **Fast setup** - Single command deployment  
✅ **Resource efficient** - Shared resources  
✅ **Easy backup** - One container to backup  

## When to Use Mono vs. Separate Containers

**Use Mono Image When:**
- Quick deployment needed
- Small to medium scale
- Simplified operations preferred
- Single server deployment
- Development/testing environments

**Use Separate Containers When:**
- Large scale production
- Need independent scaling
- Kubernetes/orchestration
- High availability requirements
- Separate database server

## Troubleshooting

### Container won't start
```bash
docker logs yolo-checkin-mono
```

### Services not responding
```bash
docker exec yolo-checkin-mono supervisorctl status
```

### Database connection issues
Wait 30-60 seconds for PostgreSQL initialization on first start.

### Port conflicts
Change exposed ports in docker-compose.mono.yml:
```yaml
ports:
  - "8080:80"  # Use port 8080 instead of 80
```

## Future Enhancements

Potential improvements:
- [ ] Redis integration for caching
- [ ] Automated backup scripts
- [ ] Monitoring with Prometheus
- [ ] Log aggregation
- [ ] Blue-green deployment support
- [ ] Database migration automation

## Documentation

- **Main README**: Deployment overview
- **docker/mono/README.md**: Detailed mono deployment guide
- **examples/deployment/production-ssl.md**: Production deployment with SSL
- **examples/deployment/arm64-deployment.md**: ARM64-specific deployment

## Support

For issues:
- Check logs: `docker logs yolo-checkin-mono`
- Review documentation
- GitHub Issues: https://github.com/np2023v2/yolo-checkin/issues

## License

MIT License - See LICENSE file in repository root.

---

**Implementation Status**: ✅ Complete and tested  
**CI/CD Status**: ✅ Configured and ready  
**Documentation**: ✅ Comprehensive  
**Multi-arch Support**: ✅ AMD64 + ARM64  
**Production Ready**: ✅ Yes  
