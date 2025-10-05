# Quick Start Guide

Get the YOLO Trainer Platform up and running in minutes!

## Prerequisites

- Docker and Docker Compose installed
- At least 8GB of RAM
- 10GB of free disk space

## Quick Start (Docker)

### 1. Clone and Navigate

```bash
git clone https://github.com/npsg02/yolo-trainer.git
cd yolo-trainer
```

### 2. Configure Environment

```bash
# Copy the example environment file
cp backend/.env.example backend/.env

# Optional: Edit backend/.env if you want to change defaults
# nano backend/.env
```

### 3. Start Services

```bash
# Start all services (PostgreSQL, Redis, Backend, Frontend)
docker-compose up -d

# View logs
docker-compose logs -f
```

### 4. Wait for Services

The services will take a minute to start. You can check their status:

```bash
docker-compose ps
```

All services should show "Up" status.

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/api/v1/docs
- **Health Check**: http://localhost:8000/health

### 6. Create Your First Account

1. Open http://localhost:3000
2. Click "Get Started"
3. Register a new account
4. Start using the platform!

## Manual Setup (Without Docker)

### Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Start PostgreSQL (if not running)
# Start Redis (if not running)

# Run the backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
# Open a new terminal
cd frontend

# Install dependencies
npm install

# Create environment file
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Run the frontend
npm run dev
```

## First Steps

### 1. Create a Dataset

```bash
# Via API
curl -X POST "http://localhost:8000/api/v1/datasets/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My First Dataset",
    "description": "A test dataset",
    "is_public": false
  }'
```

### 2. Upload Images

Use the web interface or API to upload images to your dataset.

### 3. Label Images

Use the web-based labeling interface to draw bounding boxes and assign classes.

### 4. Train a Model

Create a training job with your labeled dataset and watch it train in real-time!

## Troubleshooting

### Services Won't Start

```bash
# Check Docker status
docker --version
docker-compose --version

# Check logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres
```

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Port Already in Use

If ports 3000, 8000, 5432, or 6379 are already in use, you can change them in `docker-compose.yml`:

```yaml
services:
  backend:
    ports:
      - "8001:8000"  # Change 8001 to your preferred port
```

### Backend API Not Responding

```bash
# Check backend logs
docker-compose logs -f backend

# Restart backend
docker-compose restart backend
```

## Stopping the Application

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (deletes all data)
docker-compose down -v
```

## Next Steps

- Read the full [README.md](README.md) for detailed information
- Check [ARCHITECTURE.md](ARCHITECTURE.md) for system design
- Review [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) for development roadmap
- Explore the API documentation at http://localhost:8000/api/v1/docs

## Getting Help

- Check the documentation
- Review the FAQ section in README.md
- Open an issue on GitHub
- Check logs for error messages

## Production Deployment

For production deployment, see the "Deployment" section in [README.md](README.md).

**Important**: Change these settings for production:
- Set a strong `SECRET_KEY` in backend/.env
- Configure proper database credentials
- Enable HTTPS
- Set appropriate CORS origins
- Use production-ready database (not SQLite)
- Set up monitoring and backups
