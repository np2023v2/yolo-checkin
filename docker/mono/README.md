# YOLO Check-In Platform - Mono Docker Deployment

This directory contains configuration for deploying the entire YOLO Check-In Platform in a single Docker container.

## What's Included

The mono Docker image contains:
- **Frontend**: Next.js application (production build)
- **Backend**: FastAPI application
- **PostgreSQL**: Database server
- **Nginx**: Reverse proxy for routing requests

## Features

✅ Single Docker image for easy deployment  
✅ Multi-architecture support (ARM64 and AMD64)  
✅ Single environment file configuration  
✅ Production-ready with Nginx reverse proxy  
✅ Persistent data volumes  
✅ Health checks included  
✅ CI/CD with GitHub Actions  

## Quick Start

### Prerequisites

- Docker installed on your system
- Docker Compose (optional, for easier management)

### Option 1: Using Docker Compose (Recommended)

1. Pull the image or build it:
```bash
# Pull from GitHub Container Registry
docker pull ghcr.io/np2023v2/yolo-checkin:latest

# OR build locally
docker build -t yolo-checkin:latest -f Dockerfile.mono .
```

2. Create environment file:
```bash
cp docker/mono/.env.mono.example .env.mono
# Edit .env.mono with your configuration (especially SECRET_KEY and passwords)
```

3. Start the container:
```bash
docker-compose -f docker-compose.mono.yml up -d
```

4. Access the application:
- Application: http://localhost
- API Documentation: http://localhost/docs
- Database: localhost:5432

### Option 2: Using Docker Run

```bash
docker run -d \
  --name yolo-checkin \
  -p 80:80 \
  -p 5432:5432 \
  -e POSTGRES_USER=yolouser \
  -e POSTGRES_PASSWORD=yolopass \
  -e POSTGRES_DB=yolodb \
  -e SECRET_KEY=your-secret-key-here \
  -v yolo-postgres:/var/lib/postgresql/data \
  -v yolo-uploads:/app/uploads \
  -v yolo-models:/app/models \
  -v yolo-datasets:/app/datasets \
  ghcr.io/np2023v2/yolo-checkin:latest
```

## Configuration

### Environment Variables

All configuration is done through environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_USER` | PostgreSQL username | `yolouser` |
| `POSTGRES_PASSWORD` | PostgreSQL password | `yolopass` |
| `POSTGRES_DB` | Database name | `yolodb` |
| `SECRET_KEY` | JWT secret key | ⚠️ Change in production! |
| `API_V1_STR` | API prefix | `/api/v1` |
| `UPLOAD_DIR` | Upload directory | `/app/uploads` |
| `MODEL_DIR` | Model storage directory | `/app/models` |
| `DATASET_DIR` | Dataset directory | `/app/datasets` |

### Security Best Practices

⚠️ **Important**: Before deploying to production:

1. Generate a strong SECRET_KEY:
```bash
openssl rand -hex 32
```

2. Use strong passwords for PostgreSQL

3. Consider using Docker secrets or environment files with restricted permissions

4. Enable HTTPS with a reverse proxy (Nginx/Traefik) in front of this container

## Building the Image

### Local Build

```bash
docker build -t yolo-checkin:latest -f Dockerfile.mono .
```

### Multi-Architecture Build

```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t yolo-checkin:latest \
  -f Dockerfile.mono \
  --push .
```

## CI/CD

The project includes GitHub Actions workflow for automatic builds:

- **Trigger**: Push to `main` or `develop` branches, tags starting with `v*`
- **Platforms**: AMD64 and ARM64
- **Registry**: GitHub Container Registry (ghcr.io)
- **Caching**: GitHub Actions cache for faster builds

### Workflow File

`.github/workflows/build-mono-image.yml`

## Data Persistence

The following volumes should be mounted for data persistence:

- `/var/lib/postgresql/data` - Database data
- `/app/uploads` - Uploaded images and files
- `/app/models` - Trained models
- `/app/datasets` - Dataset files

## Monitoring and Logs

### View Logs

```bash
# All services
docker logs yolo-checkin-mono

# Specific service logs inside container
docker exec yolo-checkin-mono tail -f /var/log/backend.out.log
docker exec yolo-checkin-mono tail -f /var/log/frontend.out.log
docker exec yolo-checkin-mono tail -f /var/log/nginx/access.log
```

### Health Check

```bash
# Check container health
docker ps

# Manual health check
curl http://localhost/health
```

## Troubleshooting

### Container won't start

1. Check logs:
```bash
docker logs yolo-checkin-mono
```

2. Verify environment variables are set correctly

3. Ensure ports 80 and 5432 are not in use

### Database connection issues

1. Wait for PostgreSQL to fully initialize (first start takes longer)
2. Check PostgreSQL logs inside container
3. Verify DATABASE_URL is correctly generated

### Frontend not accessible

1. Check if Nginx is running:
```bash
docker exec yolo-checkin-mono supervisorctl status
```

2. Check Nginx logs:
```bash
docker exec yolo-checkin-mono tail -f /var/log/nginx/error.log
```

### Backend API errors

1. Check backend logs:
```bash
docker exec yolo-checkin-mono tail -f /var/log/backend.err.log
```

2. Verify database connection
3. Check if all environment variables are set

## Stopping and Removing

### Using Docker Compose

```bash
# Stop
docker-compose -f docker-compose.mono.yml stop

# Stop and remove
docker-compose -f docker-compose.mono.yml down

# Stop, remove, and delete volumes
docker-compose -f docker-compose.mono.yml down -v
```

### Using Docker

```bash
# Stop
docker stop yolo-checkin-mono

# Remove
docker rm yolo-checkin-mono

# Remove with volumes
docker rm -v yolo-checkin-mono
```

## Production Deployment

For production deployment, consider:

1. **Use a reverse proxy** (Nginx/Traefik) with SSL/TLS
2. **Set up monitoring** (Prometheus, Grafana)
3. **Configure backups** for database and volumes
4. **Use Docker secrets** for sensitive data
5. **Implement log rotation**
6. **Set resource limits** in docker-compose.yml:

```yaml
services:
  yolo-checkin-mono:
    # ... other config
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 8G
        reservations:
          cpus: '2'
          memory: 4G
```

## Architecture

```
┌─────────────────────────────────────────┐
│         Docker Container                │
│  ┌───────────────────────────────────┐  │
│  │         Nginx :80                 │  │
│  │  (Reverse Proxy & Static Files)   │  │
│  └───────┬────────────────────┬──────┘  │
│          │                    │          │
│  ┌───────▼────────┐   ┌──────▼───────┐  │
│  │   Backend      │   │   Frontend   │  │
│  │   :8000        │   │   :3000      │  │
│  │   (FastAPI)    │   │   (Next.js)  │  │
│  └────────┬───────┘   └──────────────┘  │
│           │                              │
│  ┌────────▼────────┐                    │
│  │   PostgreSQL    │                    │
│  │   :5432         │                    │
│  └─────────────────┘                    │
└─────────────────────────────────────────┘
```

## Support

For issues and questions:
- GitHub Issues: https://github.com/np2023v2/yolo-checkin/issues
- Documentation: See main README.md

## License

MIT License - See LICENSE file in the root directory.
