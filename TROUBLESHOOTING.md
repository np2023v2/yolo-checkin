# Troubleshooting Guide

This guide helps you resolve common issues with the YOLO Trainer Platform.

## Table of Contents

1. [Installation Issues](#installation-issues)
2. [Docker Issues](#docker-issues)
3. [Backend Issues](#backend-issues)
4. [Frontend Issues](#frontend-issues)
5. [Database Issues](#database-issues)
6. [Training Issues](#training-issues)
7. [Inference Issues](#inference-issues)
8. [Performance Issues](#performance-issues)

## Installation Issues

### Docker Not Found

**Problem**: `docker: command not found`

**Solution**:
```bash
# Install Docker
# For Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# For macOS
brew install --cask docker

# For Windows
# Download from https://www.docker.com/products/docker-desktop
```

### Docker Compose Not Found

**Problem**: `docker-compose: command not found`

**Solution**:
```bash
# Docker Compose is included in Docker Desktop
# Or install separately
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Permission Denied

**Problem**: `permission denied while trying to connect to the Docker daemon`

**Solution**:
```bash
# Add your user to docker group
sudo usermod -aG docker $USER

# Log out and back in, or run
newgrp docker
```

## Docker Issues

### Containers Won't Start

**Problem**: Services fail to start with `docker-compose up`

**Diagnosis**:
```bash
# Check logs
docker-compose logs

# Check specific service
docker-compose logs backend
docker-compose logs postgres
```

**Common Solutions**:

1. **Port already in use**:
```bash
# Find what's using the port
sudo lsof -i :8000
sudo lsof -i :3000
sudo lsof -i :5432

# Kill the process or change port in docker-compose.yml
```

2. **Insufficient resources**:
```bash
# Check Docker resources
docker info

# Increase Docker Desktop resources:
# Settings → Resources → Advanced
# Increase CPU and Memory
```

3. **Network issues**:
```bash
# Remove old networks
docker network prune

# Recreate containers
docker-compose down
docker-compose up -d
```

### Database Connection Failed

**Problem**: Backend can't connect to PostgreSQL

**Solution**:
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check PostgreSQL logs
docker-compose logs postgres

# Verify connection string in backend/.env
DATABASE_URL=postgresql://yolouser:yolopass@postgres:5432/yolodb

# Wait for database to be ready
docker-compose up -d postgres
sleep 10
docker-compose up -d backend
```

### Volume Permission Issues

**Problem**: Permission denied when writing to volumes

**Solution**:
```bash
# Fix permissions
sudo chown -R $USER:$USER ./uploads ./models ./datasets

# Or recreate volumes
docker-compose down -v
docker-compose up -d
```

## Backend Issues

### Module Not Found

**Problem**: `ModuleNotFoundError: No module named 'app'`

**Solution**:
```bash
# Ensure you're in the backend directory
cd backend

# Reinstall dependencies
pip install -r requirements.txt

# Check PYTHONPATH
export PYTHONPATH="${PYTHONPATH}:${PWD}"

# Or use uvicorn with correct path
uvicorn app.main:app --reload
```

### Database Migration Failed

**Problem**: Tables don't exist or schema errors

**Solution**:
```bash
# Tables are auto-created on startup
# But if issues persist:

# Install alembic
pip install alembic

# Create migration
alembic revision --autogenerate -m "Initial migration"

# Apply migration
alembic upgrade head

# Or drop and recreate
docker-compose down -v
docker-compose up -d postgres
# Wait 10 seconds
docker-compose up -d backend
```

### Authentication Errors

**Problem**: `401 Unauthorized` or token issues

**Solution**:
```bash
# Check SECRET_KEY is set in backend/.env
SECRET_KEY=your-secret-key-change-in-production

# Regenerate token
# Login again to get new token

# Check token expiration
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Verify Authorization header format
Authorization: Bearer <token>
```

### File Upload Fails

**Problem**: Images won't upload or 413 error

**Solution**:
```bash
# Check file size
MAX_UPLOAD_SIZE=104857600  # 100MB in backend/.env

# Check disk space
df -h

# Check permissions
chmod 755 uploads/ datasets/ models/

# Check file type
# Only JPEG, PNG supported
```

## Frontend Issues

### npm install Fails

**Problem**: Dependencies won't install

**Solution**:
```bash
cd frontend

# Clear cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install

# Try with legacy peer deps
npm install --legacy-peer-deps
```

### Page Not Found (404)

**Problem**: Frontend pages return 404

**Solution**:
```bash
# Check Next.js is running
npm run dev

# Check port
# Frontend should be on http://localhost:3000

# Clear .next cache
rm -rf .next
npm run dev
```

### API Connection Failed

**Problem**: Frontend can't connect to backend

**Solution**:
```bash
# Check backend is running
curl http://localhost:8000/health

# Check .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000

# Check CORS settings in backend
# Should allow your frontend origin

# Check browser console for errors
# Open DevTools → Console
```

### Build Fails

**Problem**: `npm run build` fails

**Solution**:
```bash
# Fix TypeScript errors
npm run type-check

# Fix linting errors
npm run lint

# Clear cache and rebuild
rm -rf .next
npm run build
```

## Database Issues

### Connection Refused

**Problem**: Can't connect to PostgreSQL

**Solution**:
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Test connection
docker-compose exec postgres psql -U yolouser -d yolodb

# Check credentials in .env
DATABASE_URL=postgresql://yolouser:yolopass@postgres:5432/yolodb

# Restart PostgreSQL
docker-compose restart postgres
```

### Slow Queries

**Problem**: Database operations are slow

**Solution**:
```sql
-- Add indexes (already included in models)
-- Check query performance
EXPLAIN ANALYZE SELECT * FROM datasets;

-- Vacuum database
VACUUM ANALYZE;
```

### Database Full

**Problem**: No space left on device

**Solution**:
```bash
# Check disk usage
df -h

# Clean Docker volumes
docker system prune -a --volumes

# Backup and clean old data
```

## Training Issues

### Training Fails to Start

**Problem**: Training job stays in PENDING

**Diagnosis**:
```bash
# Check training job logs
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/v1/training/1/logs

# Check backend logs
docker-compose logs -f backend
```

**Common Solutions**:

1. **No labeled images**:
```bash
# Ensure dataset has labeled images
# Check dataset statistics
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/v1/datasets/1/statistics
```

2. **Insufficient memory**:
```bash
# Reduce batch size
{
  "batch_size": 8,  # Instead of 16
  "epochs": 50
}
```

3. **CUDA/GPU issues**:
```bash
# Check GPU availability
nvidia-smi

# Force CPU training
# Set in training_service.py:
device = 'cpu'
```

### Training is Slow

**Problem**: Training takes too long

**Solution**:
```bash
# Use smaller model
model_type: "yolov8n"  # Fastest

# Reduce image size
img_size: 416  # Instead of 640

# Use GPU
# Ensure CUDA is available

# Reduce dataset size for testing
epochs: 10
```

### Out of Memory Error

**Problem**: CUDA out of memory or RAM exhausted

**Solution**:
```bash
# Reduce batch size
batch_size: 4  # or even 1

# Use smaller model
model_type: "yolov8n"

# Close other applications

# Increase Docker memory
# Docker Desktop → Settings → Resources → Memory
```

### Training Crashes

**Problem**: Training job fails with error

**Diagnosis**:
```bash
# Check error message in job
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/v1/training/1

# Check backend logs
docker-compose logs backend | grep ERROR
```

**Common Solutions**:

1. **Invalid annotations**:
```bash
# Check annotation format
# Values must be between 0 and 1
# x_center, y_center, width, height
```

2. **Missing images**:
```bash
# Ensure all images exist
# Check dataset directory
ls datasets/1/images/
```

3. **Disk space**:
```bash
df -h
# Clean up old training runs
rm -rf models/*/train_*
```

## Inference Issues

### Model Not Found

**Problem**: Can't run inference on model

**Solution**:
```bash
# Check model exists
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/v1/models/1

# Check model file exists
ls models/1/train_*/weights/best.pt

# Ensure model is deployed
curl -X POST -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/v1/models/1/deploy
```

### Inference is Slow

**Problem**: Predictions take too long

**Solution**:
```bash
# Use smaller model
# yolov8n is fastest

# Use GPU if available
# Check CUDA setup

# Reduce image size
# Resize before uploading

# Enable model caching
# Already implemented in code
```

### Wrong Predictions

**Problem**: Model detects wrong objects

**Solution**:
```bash
# Train with more data
# Add more labeled images

# Train for more epochs
epochs: 200

# Check class balance
# Ensure all classes have enough examples

# Adjust confidence threshold
confidence: 0.5  # Higher = fewer detections
```

## Performance Issues

### Backend Response Slow

**Problem**: API requests take too long

**Diagnosis**:
```bash
# Check response times
time curl http://localhost:8000/api/v1/datasets/

# Check database query performance
# Enable SQL logging in config.py
echo_pool=True
```

**Solutions**:

1. **Add database indexes** (already included)
2. **Enable Redis caching**:
```python
# In config.py
REDIS_URL=redis://localhost:6379
```

3. **Optimize queries**:
```python
# Use eager loading
.options(joinedload(Dataset.images))
```

4. **Add pagination**:
```bash
# Use skip and limit
curl "http://localhost:8000/api/v1/datasets/?skip=0&limit=10"
```

### High Memory Usage

**Problem**: System running out of memory

**Solution**:
```bash
# Check memory usage
docker stats

# Reduce worker processes
# In docker-compose.yml
command: uvicorn app.main:app --workers 2

# Close unused applications

# Restart containers
docker-compose restart
```

### High CPU Usage

**Problem**: CPU at 100%

**Solution**:
```bash
# Check what's using CPU
docker stats

# Reduce concurrent operations
# Limit batch size in training

# Use async operations
# Already implemented in FastAPI

# Scale horizontally
# Add more backend instances
```

## Getting Help

If you can't resolve your issue:

1. **Check logs**:
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs backend
docker-compose logs frontend
```

2. **Check documentation**:
- [README.md](README.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [QUICKSTART.md](QUICKSTART.md)

3. **Search for errors**:
- Copy error message
- Search in GitHub issues
- Search online

4. **Create an issue**:
- Go to GitHub repository
- Click "Issues" → "New Issue"
- Provide:
  - Error message
  - Steps to reproduce
  - System information
  - Logs

5. **Community support**:
- Check GitHub Discussions
- Ask on Stack Overflow with tag `yolo-trainer`

## Debug Mode

Enable debug mode for more information:

### Backend Debug
```python
# In backend/app/main.py
app = FastAPI(debug=True)

# Or set environment variable
DEBUG=True uvicorn app.main:app --reload
```

### Frontend Debug
```javascript
// Check browser console (F12)
// Enable verbose logging
console.log(process.env.NODE_ENV)
```

### Docker Debug
```bash
# Run container interactively
docker-compose run backend /bin/bash

# Check container internals
docker-compose exec backend ls -la
docker-compose exec backend env
```

## Preventive Measures

1. **Regular backups**:
```bash
# Backup database
docker-compose exec postgres pg_dump -U yolouser yolodb > backup.sql

# Backup files
tar -czf backup.tar.gz uploads/ models/ datasets/
```

2. **Monitor resources**:
```bash
# Check disk space regularly
df -h

# Monitor Docker
docker stats
```

3. **Keep updated**:
```bash
# Update dependencies
cd backend && pip install -r requirements.txt --upgrade
cd frontend && npm update

# Update Docker images
docker-compose pull
docker-compose up -d
```

4. **Clean up regularly**:
```bash
# Remove old containers
docker system prune

# Clean old training runs
rm -rf models/*/train_old_*

# Vacuum database
docker-compose exec postgres psql -U yolouser -d yolodb -c "VACUUM ANALYZE;"
```

## Additional Resources

- Docker Documentation: https://docs.docker.com/
- FastAPI Documentation: https://fastapi.tiangolo.com/
- PostgreSQL Documentation: https://www.postgresql.org/docs/
- Ultralytics YOLO: https://docs.ultralytics.com/
- Next.js Documentation: https://nextjs.org/docs

---

**Still having issues?** Open an issue on GitHub with:
- Detailed description
- Error messages
- System information
- Steps to reproduce
