# YOLO Trainer Platform

A comprehensive web-based platform for creating, labeling, training, and deploying YOLO object detection models. Built with FastAPI (Python), PostgreSQL, and Next.js.

## Features

- 🎯 **Dataset Management**: Create and manage custom YOLO datasets
- 🏷️ **Web-Based Labeling**: Label images directly in the browser with an intuitive interface
- 🚀 **One-Click Training**: Train YOLO models with customizable parameters
- 🧪 **Model Testing**: Test your trained models with new images
- 📦 **Model Deployment**: Deploy models as REST APIs for inference
- 💾 **Model Download**: Download trained models for local use
- 📤 **Custom Model Upload**: Load and use your own pre-trained YOLO models

## Architecture

### Backend (FastAPI)
- RESTful API with FastAPI
- PostgreSQL database for data persistence
- Redis for caching and task queuing
- Ultralytics YOLO for training and inference
- SQLAlchemy ORM for database operations
- JWT authentication

### Frontend (Next.js)
- React-based UI with Next.js 14
- TypeScript for type safety
- Tailwind CSS for styling
- Axios for API communication
- React Konva for image annotation

### Database (PostgreSQL)
- Users and authentication
- Datasets and images
- Annotations and labels
- Models and training jobs
- Training metrics and logs

## Project Structure

```
yolo-trainer/
├── backend/
│   ├── app/
│   │   ├── api/              # API endpoints
│   │   │   ├── auth.py       # Authentication
│   │   │   ├── datasets.py   # Dataset management
│   │   │   ├── models_api.py # Model management
│   │   │   ├── training.py   # Training jobs
│   │   │   └── predictions.py # Inference
│   │   ├── core/             # Core functionality
│   │   │   ├── config.py     # Configuration
│   │   │   └── security.py   # Security utilities
│   │   ├── db/               # Database
│   │   │   └── session.py    # Database session
│   │   ├── models/           # Database models
│   │   │   └── models.py     # SQLAlchemy models
│   │   ├── schemas/          # Pydantic schemas
│   │   │   └── schemas.py    # API schemas
│   │   ├── services/         # Business logic
│   │   │   └── training_service.py # Training service
│   │   └── main.py           # FastAPI application
│   ├── requirements.txt      # Python dependencies
│   ├── Dockerfile           # Docker configuration
│   └── .env.example         # Environment variables example
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js app directory
│   │   │   ├── layout.tsx   # Root layout
│   │   │   ├── page.tsx     # Home page
│   │   │   └── globals.css  # Global styles
│   │   ├── components/      # React components
│   │   ├── lib/             # Utilities
│   │   │   └── api.ts       # API client
│   │   └── types/           # TypeScript types
│   │       └── index.ts     # Type definitions
│   ├── package.json         # Node dependencies
│   ├── tsconfig.json        # TypeScript config
│   ├── tailwind.config.js   # Tailwind config
│   └── Dockerfile           # Docker configuration
├── docker-compose.yml       # Docker Compose configuration
├── uploads/                 # Uploaded files
├── models/                  # Trained models
├── datasets/                # Dataset storage
└── README.md               # This file
```

## Getting Started

### Prerequisites

- Docker and Docker Compose (recommended)
- OR Python 3.11+, Node.js 18+, PostgreSQL 15+, Redis

### Quick Start with Docker

1. Clone the repository:
```bash
git clone https://github.com/npsg02/yolo-trainer.git
cd yolo-trainer
```

2. Create environment file:
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your configuration
```

3. Start all services:
```bash
docker-compose up -d
```

4. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/api/v1/docs

### Manual Setup

#### Backend Setup

1. Create and activate virtual environment:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create `.env` file:
```bash
cp .env.example .env
# Edit .env with your database and configuration
```

4. Start PostgreSQL and Redis (if not using Docker)

5. Run the application:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Create environment file:
```bash
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
```

3. Run the development server:
```bash
npm run dev
```

## Usage Guide

### 1. User Registration and Login

1. Navigate to http://localhost:3000
2. Click "Get Started" and register a new account
3. Log in with your credentials

### 2. Creating a Dataset

1. Go to the "Datasets" page
2. Click "Create New Dataset"
3. Enter dataset name and description
4. Upload images to your dataset

### 3. Labeling Images

1. Open your dataset
2. Click on an image to start labeling
3. Draw bounding boxes around objects
4. Assign class labels to each box
5. Save annotations

### 4. Training a Model

1. Go to the "Training" page
2. Click "Create Training Job"
3. Select your dataset
4. Choose model type (YOLOv8n/s/m/l/x)
5. Configure training parameters:
   - Epochs
   - Batch size
   - Image size
   - Learning rate
6. Click "Start Training"
7. Monitor training progress in real-time

### 5. Testing a Model

1. Go to the "Testing" page
2. Select a trained model
3. Upload a test image
4. View detection results with bounding boxes

### 6. Deploying a Model

1. Go to the "Models" page
2. Select a trained model
3. Click "Deploy Model"
4. Use the provided API endpoint for inference

### 7. Using the API

```python
import requests

# Inference example
with open('image.jpg', 'rb') as f:
    response = requests.post(
        'http://localhost:8000/api/v1/predictions/infer',
        params={'model_id': 1, 'confidence': 0.25},
        files={'file': f},
        headers={'Authorization': 'Bearer YOUR_TOKEN'}
    )
    
predictions = response.json()
print(predictions)
```

### 8. Downloading Models

1. Go to the "Models" page
2. Select a model
3. Click "Download Model"
4. Save the .pt file for local use

### 9. Uploading Custom Models

1. Go to the "Models" page
2. Create a new model entry
3. Click "Upload Custom Model"
4. Select your .pt or .pth file
5. Deploy and use your custom model

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/auth/me` - Get current user

### Datasets
- `GET /api/v1/datasets/` - List datasets
- `POST /api/v1/datasets/` - Create dataset
- `GET /api/v1/datasets/{id}` - Get dataset
- `PUT /api/v1/datasets/{id}` - Update dataset
- `DELETE /api/v1/datasets/{id}` - Delete dataset
- `POST /api/v1/datasets/{id}/images` - Upload image
- `GET /api/v1/datasets/{id}/images` - List images
- `POST /api/v1/datasets/{id}/images/{image_id}/annotations` - Create annotation
- `GET /api/v1/datasets/{id}/images/{image_id}/annotations` - Get annotations
- `GET /api/v1/datasets/{id}/statistics` - Get dataset statistics

### Models
- `GET /api/v1/models/` - List models
- `POST /api/v1/models/` - Create model
- `GET /api/v1/models/{id}` - Get model
- `PUT /api/v1/models/{id}` - Update model
- `DELETE /api/v1/models/{id}` - Delete model
- `POST /api/v1/models/{id}/upload` - Upload model file
- `GET /api/v1/models/{id}/download` - Download model
- `POST /api/v1/models/{id}/deploy` - Deploy model
- `POST /api/v1/models/{id}/undeploy` - Undeploy model

### Training
- `GET /api/v1/training/` - List training jobs
- `POST /api/v1/training/` - Create training job
- `GET /api/v1/training/{id}` - Get training job
- `DELETE /api/v1/training/{id}` - Cancel/delete training job
- `GET /api/v1/training/{id}/logs` - Get training logs

### Predictions
- `POST /api/v1/predictions/infer` - Run inference
- `POST /api/v1/predictions/test/{model_id}` - Test model

## Configuration

### Environment Variables

Backend (`.env`):
```env
DATABASE_URL=postgresql://yolouser:yolopass@localhost:5432/yolodb
REDIS_URL=redis://localhost:6379
SECRET_KEY=your-secret-key-change-in-production
API_V1_STR=/api/v1
UPLOAD_DIR=./uploads
MODEL_DIR=./models
DATASET_DIR=./datasets
```

Frontend (`.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Development

### Running Tests

Backend:
```bash
cd backend
pytest
```

Frontend:
```bash
cd frontend
npm test
```

### Code Formatting

Backend:
```bash
black app/
isort app/
```

Frontend:
```bash
npm run lint
npm run format
```

## Deployment

### Production Deployment

1. Update environment variables for production
2. Use production-ready database and Redis instances
3. Enable HTTPS
4. Configure proper CORS settings
5. Set up monitoring and logging

### Docker Production

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Supported YOLO Models

- YOLOv8n (Nano) - Fastest, smallest
- YOLOv8s (Small) - Balanced
- YOLOv8m (Medium) - Good accuracy
- YOLOv8l (Large) - High accuracy
- YOLOv8x (Extra Large) - Best accuracy

## Troubleshooting

### Common Issues

1. **Database connection errors**: Ensure PostgreSQL is running and credentials are correct
2. **Redis connection errors**: Ensure Redis is running
3. **Training failures**: Check GPU availability and memory
4. **Upload failures**: Check file size limits and permissions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License

## Support

For issues and questions, please open an issue on GitHub.

## Acknowledgments

- Ultralytics YOLO for the object detection framework
- FastAPI for the excellent web framework
- Next.js for the React framework