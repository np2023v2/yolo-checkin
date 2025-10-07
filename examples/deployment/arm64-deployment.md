# ARM64 Deployment (Raspberry Pi, AWS Graviton, Apple Silicon)

This guide helps you deploy the YOLO Check-In Platform on ARM64 architecture devices.

## Supported ARM64 Platforms

✅ Raspberry Pi 4/5 (8GB RAM recommended)  
✅ AWS Graviton instances (t4g, c7g, etc.)  
✅ Oracle Cloud Ampere instances  
✅ Apple Silicon Macs (M1/M2/M3) - for development  
✅ Other ARM64 Linux devices  

## Prerequisites

- ARM64 device with:
  - At least 4GB RAM (8GB recommended)
  - 20GB free disk space
  - Docker installed
  - Internet connection

## Installation

### Step 1: Install Docker (if not already installed)

**Raspberry Pi / Debian/Ubuntu ARM64:**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker
```

**Verify architecture:**
```bash
docker version --format '{{.Server.Arch}}'
# Should output: arm64
```

### Step 2: Pull and Run

The multi-architecture image will automatically pull the ARM64 version:

```bash
# Pull image
docker pull ghcr.io/np2023v2/yolo-checkin:latest

# Create environment file
cat > .env.mono <<EOF
POSTGRES_USER=yolouser
POSTGRES_PASSWORD=yolopass
POSTGRES_DB=yolodb
SECRET_KEY=$(openssl rand -hex 32)
API_V1_STR=/api/v1
EOF

# Run with docker-compose
curl -o docker-compose.mono.yml https://raw.githubusercontent.com/np2023v2/yolo-checkin/main/docker-compose.mono.yml

docker-compose -f docker-compose.mono.yml up -d
```

### Step 3: Access

- Application: http://localhost
- API Docs: http://localhost/docs

## Performance Tuning for ARM64

### Raspberry Pi 4/5

Add to `docker-compose.mono.yml`:

```yaml
services:
  yolo-checkin-mono:
    # ... existing config ...
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 6G
        reservations:
          cpus: '2'
          memory: 2G
```

### AWS Graviton (t4g.large)

```yaml
services:
  yolo-checkin-mono:
    # ... existing config ...
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 7G
        reservations:
          cpus: '1'
          memory: 4G
```

## Raspberry Pi Specific Setup

### Enable Memory Swap

Edit `/boot/cmdline.txt` and ensure swap is enabled:
```bash
sudo nano /boot/cmdline.txt
# Add: cgroup_memory=1 cgroup_enable=memory
```

Reboot:
```bash
sudo reboot
```

### Increase GPU Memory (Optional)

Edit `/boot/config.txt`:
```bash
sudo nano /boot/config.txt
# Add: gpu_mem=256
```

### Monitor Resources

```bash
# CPU/Memory usage
docker stats

# System temperature (Raspberry Pi)
vcgencmd measure_temp

# System resources
htop
```

## AWS Graviton Deployment

### Launch Instance

1. Choose ARM64-based instance (t4g.medium or larger)
2. Use Ubuntu 22.04 LTS ARM64 AMI
3. Configure security groups:
   - Allow port 80 (HTTP)
   - Allow port 443 (HTTPS)
   - Allow port 22 (SSH)

### Deploy

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu

# Deploy application
docker pull ghcr.io/np2023v2/yolo-checkin:latest
docker-compose -f docker-compose.mono.yml up -d
```

### Set up monitoring

```bash
# Install monitoring tools
sudo apt install prometheus-node-exporter
```

## Performance Comparison

| Platform | RAM | Build Time | Inference Time | Notes |
|----------|-----|------------|----------------|-------|
| Raspberry Pi 4 8GB | 8GB | ~20 min | ~2-3s | Good for testing |
| AWS t4g.medium | 4GB | ~12 min | ~1-2s | Budget production |
| AWS t4g.large | 8GB | ~10 min | ~0.8-1s | Recommended |
| AWS c7g.large | 8GB | ~8 min | ~0.5-0.8s | High performance |

## Troubleshooting

### Out of Memory

Reduce resource usage:
```yaml
deploy:
  resources:
    limits:
      memory: 2G  # Lower limit
```

### Slow Performance

1. Check swap usage:
```bash
free -h
```

2. Check disk I/O:
```bash
iostat -x 1
```

3. Use faster storage (SSD instead of SD card for Raspberry Pi)

### Container Fails to Start

Check logs:
```bash
docker logs yolo-checkin-mono
```

Common issues:
- Insufficient memory
- Disk space full
- Port conflicts

## Optimization Tips

1. **Use SSD storage** - Much faster than SD cards (Raspberry Pi)
2. **Enable swap** - Helps with memory pressure
3. **Monitor temperature** - Ensure adequate cooling
4. **Use CDN** - For static assets in production
5. **Enable compression** - Nginx gzip already configured

## Backup on ARM64

```bash
# Backup script
cat > backup.sh <<'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p backups

# Backup database
docker exec yolo-checkin-mono pg_dump -U yolouser yolodb > backups/db_$DATE.sql

# Backup volumes
docker run --rm \
  -v yolo-checkin_postgres_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/postgres_data_$DATE.tar.gz /data

echo "Backup completed: $DATE"
EOF

chmod +x backup.sh
```

## Resources

- [ARM64 Docker Documentation](https://docs.docker.com/engine/install/)
- [AWS Graviton](https://aws.amazon.com/ec2/graviton/)
- [Raspberry Pi Documentation](https://www.raspberrypi.org/documentation/)

## Support

For ARM64-specific issues, please include:
- Platform (Raspberry Pi 4, AWS Graviton, etc.)
- Memory available
- Docker version
- Output of `uname -a`
