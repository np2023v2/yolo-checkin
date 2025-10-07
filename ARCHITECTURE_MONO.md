# Mono Docker Architecture and Workflow

This document provides visual representations of the mono Docker implementation.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Docker Container (Port 80)                    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Nginx Reverse Proxy (:80)                   │   │
│  │  • Routes requests to backend/frontend                   │   │
│  │  • Serves static files                                   │   │
│  │  • Gzip compression                                      │   │
│  │  • Security headers                                      │   │
│  └────┬──────────────────────────────────────────┬─────────┘   │
│       │                                          │              │
│       │ /api/*                                   │ /*           │
│       │ /docs, /redoc                            │              │
│       │                                          │              │
│  ┌────▼───────────────────┐           ┌─────────▼──────────┐   │
│  │   Backend :8000        │           │  Frontend :3000    │   │
│  │   ┌──────────────────┐ │           │  ┌───────────────┐ │   │
│  │   │ FastAPI/Uvicorn  │ │           │  │   Next.js     │ │   │
│  │   │                  │ │           │  │  (Production) │ │   │
│  │   │ • REST API       │ │           │  │               │ │   │
│  │   │ • JWT Auth       │ │           │  │ • React UI    │ │   │
│  │   │ • YOLO Training  │ │           │  │ • Tailwind    │ │   │
│  │   │ • Face Recog     │ │           │  │ • TypeScript  │ │   │
│  │   └────────┬─────────┘ │           │  └───────────────┘ │   │
│  └────────────┼────────────┘           └────────────────────┘   │
│               │                                                  │
│  ┌────────────▼──────────────────┐                              │
│  │   PostgreSQL 15 (:5432)       │                              │
│  │   ┌─────────────────────────┐ │                              │
│  │   │ • Users & Auth          │ │                              │
│  │   │ • Datasets & Images     │ │                              │
│  │   │ • Models & Training     │ │                              │
│  │   │ • Face Encodings        │ │                              │
│  │   │ • Attendance Records    │ │                              │
│  │   └─────────────────────────┘ │                              │
│  └───────────────────────────────┘                              │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Supervisord (Process Manager)                │   │
│  │  • Manages all processes                                  │   │
│  │  • Auto-restart on failure                                │   │
│  │  • Log management                                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Data Volumes:                                                   │
│  • /var/lib/postgresql/data  → postgres_data                    │
│  • /app/uploads              → uploads_data                     │
│  • /app/models               → models_data                      │
│  • /app/datasets             → datasets_data                    │
└─────────────────────────────────────────────────────────────────┘
```

## Build Pipeline

```
┌──────────────┐
│  Git Push    │
│  (main/tags) │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────┐
│   GitHub Actions Workflow        │
│   (.github/workflows/            │
│    build-mono-image.yml)         │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│   Setup Build Environment        │
│   • Checkout code                │
│   • Setup QEMU (multi-arch)      │
│   • Setup Docker Buildx          │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│   Multi-Stage Docker Build       │
│                                  │
│   Stage 1: Frontend Builder      │
│   ├─ Node.js 18 Alpine           │
│   ├─ npm install                 │
│   ├─ npm run build               │
│   └─ Output: .next/ (optimized)  │
│                                  │
│   Stage 2: Backend Builder       │
│   ├─ Python 3.11 Slim            │
│   ├─ pip install dependencies    │
│   └─ Output: Python packages     │
│                                  │
│   Stage 3: Final Image           │
│   ├─ Python 3.11 Slim base       │
│   ├─ Install PostgreSQL 15       │
│   ├─ Install Node.js 18          │
│   ├─ Install Nginx               │
│   ├─ Install Supervisord         │
│   ├─ Copy backend code           │
│   ├─ Copy frontend build         │
│   └─ Copy config files           │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│   Build for Platforms            │
│   ├─ linux/amd64 (x86_64)        │
│   └─ linux/arm64 (aarch64)       │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│   Push to Registry               │
│   ghcr.io/np2023v2/yolo-checkin │
│   Tags:                          │
│   • latest                       │
│   • v1.0.0 (version tags)        │
│   • main-abc1234 (SHA)           │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│   Generate Attestation           │
│   (Build provenance)             │
└──────────────────────────────────┘
```

## Deployment Flow

```
┌──────────────────┐
│  User/DevOps     │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────┐
│  Pull Image                      │
│  docker pull ghcr.io/            │
│  np2023v2/yolo-checkin:latest    │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│  Configure Environment           │
│  • Copy .env.mono.example        │
│  • Set POSTGRES_PASSWORD         │
│  • Generate SECRET_KEY           │
│  • Set other variables           │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│  Deploy Container                │
│  docker-compose -f               │
│  docker-compose.mono.yml up -d   │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│  Container Startup               │
│  ┌────────────────────────────┐  │
│  │ 1. Run init.sh             │  │
│  │    ├─ Init PostgreSQL      │  │
│  │    ├─ Create DB & user     │  │
│  │    ├─ Configure env vars   │  │
│  │    └─ Start supervisord    │  │
│  │                            │  │
│  │ 2. Supervisord starts:     │  │
│  │    ├─ PostgreSQL           │  │
│  │    ├─ Backend (FastAPI)    │  │
│  │    ├─ Frontend (Next.js)   │  │
│  │    └─ Nginx                │  │
│  └────────────────────────────┘  │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│  Health Check                    │
│  curl http://localhost/health    │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│  Application Ready               │
│  • Frontend: http://localhost    │
│  • API Docs: http://localhost    │
│             /docs                │
└──────────────────────────────────┘
```

## Request Flow

### API Request Flow
```
User Browser
     │
     │ GET /api/v1/datasets
     ▼
Container :80 (Nginx)
     │
     │ proxy_pass http://127.0.0.1:8000
     ▼
Backend :8000 (FastAPI)
     │
     │ JWT validation
     │ Business logic
     ▼
PostgreSQL :5432
     │
     │ Query results
     ▼
Backend :8000
     │
     │ JSON response
     ▼
Nginx :80
     │
     │ Add headers
     │ Gzip compression
     ▼
User Browser
```

### Frontend Request Flow
```
User Browser
     │
     │ GET /
     ▼
Container :80 (Nginx)
     │
     │ proxy_pass http://127.0.0.1:3000
     ▼
Frontend :3000 (Next.js)
     │
     │ Server-side rendering
     │ or Static page
     ▼
Nginx :80
     │
     │ HTML response
     ▼
User Browser
     │
     │ Client-side rendering
     │ API calls to /api/*
     ▼
Backend via Nginx
```

## Configuration Flow

```
Environment Variables
     │
     │ POSTGRES_USER=yolouser
     │ POSTGRES_PASSWORD=pass
     │ SECRET_KEY=...
     ▼
init.sh (Startup Script)
     │
     ├─────────────────────┐
     │                     │
     ▼                     ▼
PostgreSQL Setup    Backend Config
     │               (/app/backend/.env)
     │                     │
     │                     ├─ DATABASE_URL=...
     │                     ├─ SECRET_KEY=...
     │                     └─ API_V1_STR=...
     │                     │
     ▼                     ▼
Database Ready      Backend Ready
     │                     │
     └──────────┬──────────┘
                ▼
         Supervisord
         (Start All Services)
                │
                ├─ Backend
                ├─ Frontend
                └─ Nginx
```

## Data Persistence

```
┌─────────────────────────────────────────┐
│         Docker Host                     │
│                                         │
│  Named Volumes:                         │
│  ┌───────────────────────────────────┐  │
│  │ postgres_data                     │  │
│  │  ├─ base/                         │  │
│  │  ├─ global/                       │  │
│  │  ├─ pg_wal/                       │  │
│  │  └─ ...                           │  │
│  └──────────────┬────────────────────┘  │
│                 │ mounted to            │
│                 ▼                       │
│  ┌───────────────────────────────────┐  │
│  │ Container                         │  │
│  │ /var/lib/postgresql/data          │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ uploads_data                      │  │
│  │  ├─ images/                       │  │
│  │  └─ faces/                        │  │
│  └──────────────┬────────────────────┘  │
│                 │ mounted to            │
│                 ▼                       │
│  ┌───────────────────────────────────┐  │
│  │ Container                         │  │
│  │ /app/uploads                      │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ models_data                       │  │
│  │  ├─ yolov8n.pt                    │  │
│  │  └─ custom_model.pt               │  │
│  └──────────────┬────────────────────┘  │
│                 │ mounted to            │
│                 ▼                       │
│  ┌───────────────────────────────────┐  │
│  │ Container                         │  │
│  │ /app/models                       │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ datasets_data                     │  │
│  │  ├─ dataset1/                     │  │
│  │  └─ dataset2/                     │  │
│  └──────────────┬────────────────────┘  │
│                 │ mounted to            │
│                 ▼                       │
│  ┌───────────────────────────────────┐  │
│  │ Container                         │  │
│  │ /app/datasets                     │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## Multi-Architecture Support

```
GitHub Container Registry
ghcr.io/np2023v2/yolo-checkin:latest

         │
         │ Manifest List (multi-arch)
         │
         ├──────────────────┬──────────────────┐
         │                  │                  │
         ▼                  ▼                  ▼
    linux/amd64        linux/arm64       linux/arm/v7
    (x86_64)           (aarch64)         (32-bit ARM)
         │                  │                  
         │                  │                  
    ┌────▼─────┐       ┌────▼─────┐      
    │ Intel/   │       │ ARM64    │      
    │ AMD      │       │ Devices  │      
    │ Servers  │       │          │      
    │          │       │ • Pi 4/5 │      
    │ • Cloud  │       │ • AWS    │      
    │   VMs    │       │   Graviton│     
    │ • Dev    │       │ • Apple  │      
    │   PCs    │       │   Silicon│      
    └──────────┘       └──────────┘      

Docker automatically pulls the correct architecture
based on the host system.
```

## Monitoring and Logging

```
┌────────────────────────────────────────────┐
│          Docker Container                  │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │     Supervisord (Process Manager)    │  │
│  │                                      │  │
│  │  Stdout/Stderr Logs:                │  │
│  │  ├─ Backend  → /var/log/backend.*   │  │
│  │  ├─ Frontend → /var/log/frontend.*  │  │
│  │  └─ Nginx    → /var/log/nginx/*     │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  Container Logs:                           │
│  docker logs yolo-checkin-mono             │
│         │                                  │
│         └─ All stdout/stderr combined      │
└────────────────────────────────────────────┘
         │
         │ View Logs:
         │
    ┌────▼───────────────────────────────┐
    │ docker logs yolo-checkin-mono      │
    │ docker exec ... tail -f /var/log/  │
    │ docker exec ... supervisorctl status│
    └────────────────────────────────────┘
```

## Security Layers

```
┌─────────────────────────────────────────┐
│  Internet / External Network            │
└─────────────┬───────────────────────────┘
              │
              │ HTTPS (with reverse proxy)
              ▼
┌─────────────────────────────────────────┐
│  Reverse Proxy (Optional)               │
│  • SSL/TLS Termination                  │
│  • Additional Security Headers          │
└─────────────┬───────────────────────────┘
              │
              │ HTTP
              ▼
┌─────────────────────────────────────────┐
│  Docker Container :80                   │
│  ┌───────────────────────────────────┐  │
│  │ Nginx (:80)                       │  │
│  │ • Rate limiting                   │  │
│  │ • Request filtering               │  │
│  │ • Security headers                │  │
│  └──────────┬────────────────────────┘  │
│             │                           │
│             │ Internal                  │
│             ▼                           │
│  ┌───────────────────────────────────┐  │
│  │ Backend (:8000)                   │  │
│  │ • JWT Authentication              │  │
│  │ • Request validation              │  │
│  │ • SQL injection protection        │  │
│  └──────────┬────────────────────────┘  │
│             │                           │
│             │ localhost only            │
│             ▼                           │
│  ┌───────────────────────────────────┐  │
│  │ PostgreSQL (:5432)                │  │
│  │ • Password authentication         │  │
│  │ • Not exposed externally          │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘

Environment Variables (Secrets):
• POSTGRES_PASSWORD
• SECRET_KEY
```

## Summary

This architecture provides:

✅ **Single Container** - Easy deployment and management  
✅ **Service Isolation** - Each service runs independently via supervisord  
✅ **Reverse Proxy** - Efficient request routing and security  
✅ **Data Persistence** - Named volumes for data  
✅ **Multi-Architecture** - Works on AMD64 and ARM64  
✅ **Security** - Multiple layers of security  
✅ **Monitoring** - Built-in logging and health checks  
✅ **Scalability** - Can be scaled horizontally behind a load balancer  
