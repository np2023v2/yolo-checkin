# YOLO Trainer Platform - Architecture Document

## System Overview

The YOLO Trainer Platform is a full-stack web application that enables users to create, label, train, and deploy YOLO object detection models through an intuitive interface. The system is designed with a microservices-like architecture using modern technologies.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
│                         (Next.js)                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Dataset │  │ Labeling │  │ Training │  │  Testing │   │
│  │   Pages  │  │Interface │  │   Pages  │  │   Pages  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────┬───────────────────────────────┘
                              │ HTTP/REST API
                              │
┌─────────────────────────────▼───────────────────────────────┐
│                        Backend Layer                         │
│                         (FastAPI)                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   Auth   │  │ Datasets │  │  Models  │  │ Training │   │
│  │   API    │  │   API    │  │   API    │  │   API    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │Prediction│  │  Upload  │  │Background│                  │
│  │   API    │  │ Service  │  │  Tasks   │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
└─────────────────────────────┬───────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
┌─────────▼─────────┐ ┌───────▼────────┐ ┌───────▼────────┐
│    PostgreSQL     │ │     Redis      │ │  File Storage  │
│   (Database)      │ │   (Cache)      │ │  (Models/Data) │
└───────────────────┘ └────────────────┘ └────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: Next.js 14 (React 18)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React hooks + Zustand (optional)
- **HTTP Client**: Axios
- **Image Annotation**: React Konva
- **Charts**: Recharts
- **Icons**: Lucide React

### Backend
- **Framework**: FastAPI 0.104+
- **Language**: Python 3.11+
- **Web Server**: Uvicorn
- **ORM**: SQLAlchemy 2.0
- **Database Driver**: psycopg2
- **Authentication**: JWT (python-jose)
- **Password Hashing**: passlib with bcrypt
- **YOLO Framework**: Ultralytics YOLOv8
- **Computer Vision**: OpenCV, Pillow
- **Deep Learning**: PyTorch
- **Task Queue**: Celery (optional for background tasks)

### Database & Cache
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Migrations**: Alembic

### DevOps
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **File Storage**: Local filesystem (can be extended to S3/cloud storage)

## Component Architecture

### 1. Frontend Components

#### Pages
- **Home Page**: Landing page with navigation
- **Auth Pages**: Login/Register
- **Dashboard**: Overview of datasets, models, and training jobs
- **Datasets Page**: List and manage datasets
- **Dataset Detail**: View/edit single dataset
- **Labeling Interface**: Annotate images with bounding boxes
- **Training Page**: Create and monitor training jobs
- **Models Page**: List and manage models
- **Testing Page**: Test models with new images
- **API Docs**: Link to backend API documentation

#### Components
- **Layout**: Navigation, header, footer
- **DatasetCard**: Display dataset summary
- **ImageAnnotator**: Canvas-based annotation tool
- **ModelCard**: Display model information
- **TrainingMonitor**: Real-time training progress
- **FileUploader**: Drag-and-drop file upload
- **BoundingBoxViewer**: Display predictions

### 2. Backend Components

#### API Endpoints

**Authentication API** (`/api/v1/auth`)
- User registration
- User login (JWT token generation)
- Current user info
- Token validation

**Datasets API** (`/api/v1/datasets`)
- CRUD operations for datasets
- Image upload and management
- Annotation CRUD operations
- Dataset statistics
- Data validation and splitting

**Models API** (`/api/v1/models`)
- CRUD operations for models
- Model file upload/download
- Deploy/undeploy model
- Model metrics and info

**Training API** (`/api/v1/training`)
- Create training job
- List training jobs
- Get training status
- View training logs
- Cancel training

**Predictions API** (`/api/v1/predictions`)
- Run inference on images
- Test models
- Batch predictions

#### Services

**Training Service**
- Dataset preparation in YOLO format
- YOLO model training
- Training progress tracking
- Model evaluation
- Results storage

**File Upload Service**
- Handle multipart file uploads
- Validate file types and sizes
- Store files securely
- Generate thumbnails (optional)

**Authentication Service**
- User authentication
- Password hashing and verification
- JWT token generation and validation
- Permission checking

### 3. Database Schema

#### Tables

**users**
- id (PK)
- email (unique)
- username (unique)
- hashed_password
- is_active
- is_superuser
- created_at
- updated_at

**datasets**
- id (PK)
- name
- description
- owner_id (FK -> users.id)
- num_classes
- num_images
- class_names (JSON)
- is_public
- created_at
- updated_at

**dataset_images**
- id (PK)
- dataset_id (FK -> datasets.id)
- filename
- file_path
- width, height
- is_labeled
- split (train/val/test)
- created_at

**annotations**
- id (PK)
- image_id (FK -> dataset_images.id)
- class_id
- class_name
- x_center, y_center, width, height (normalized 0-1)
- confidence
- created_at

**models**
- id (PK)
- name
- description
- owner_id (FK -> users.id)
- model_type (yolov8n/s/m/l/x)
- file_path
- num_classes
- class_names (JSON)
- metrics (JSON)
- is_public
- is_deployed
- created_at
- updated_at

**training_jobs**
- id (PK)
- user_id (FK -> users.id)
- dataset_id (FK -> datasets.id)
- model_id (FK -> models.id)
- status (pending/running/completed/failed)
- epochs, batch_size, img_size, learning_rate, patience
- current_epoch
- best_map
- training_time
- logs
- error_message
- started_at, completed_at, created_at

## Data Flow

### 1. Dataset Creation Flow

```
User -> Frontend: Create Dataset
Frontend -> Backend: POST /api/v1/datasets/
Backend -> Database: Insert dataset record
Backend -> FileSystem: Create dataset directory
Backend -> Frontend: Return dataset info
Frontend -> User: Show success message
```

### 2. Image Upload & Labeling Flow

```
User -> Frontend: Upload images
Frontend -> Backend: POST /api/v1/datasets/{id}/images
Backend -> FileSystem: Save image files
Backend -> Database: Insert image records
Backend -> Frontend: Return image info

User -> Frontend: Draw bounding boxes
Frontend: Store annotations temporarily
User -> Frontend: Save annotations
Frontend -> Backend: POST /api/v1/datasets/{id}/images/{img_id}/annotations
Backend -> Database: Insert annotation records
Backend -> FileSystem: Create YOLO format labels
Backend -> Frontend: Return success
```

### 3. Model Training Flow

```
User -> Frontend: Create training job
Frontend -> Backend: POST /api/v1/training/
Backend -> Database: Create training_job record (status=pending)
Backend -> Background Task: Start training
Backend -> Frontend: Return job info

Background Task:
1. Update status to 'running'
2. Prepare dataset in YOLO format
3. Initialize YOLO model
4. Train model with specified parameters
5. Save best model weights
6. Update model record with file_path
7. Update job status to 'completed'
8. Store metrics and logs

Frontend: Poll for status updates
Frontend -> Backend: GET /api/v1/training/{id}
Backend -> Database: Get current status
Backend -> Frontend: Return status and progress
```

### 4. Model Testing/Inference Flow

```
User -> Frontend: Upload test image
Frontend -> Backend: POST /api/v1/predictions/infer
Backend -> FileSystem: Save temp image
Backend -> YOLO Model: Load model and run inference
Backend -> Frontend: Return predictions (bounding boxes)
Frontend: Display image with bounding boxes
Backend -> FileSystem: Delete temp image
```

### 5. Model Deployment Flow

```
User -> Frontend: Deploy model
Frontend -> Backend: POST /api/v1/models/{id}/deploy
Backend -> Database: Set is_deployed = true
Backend -> Frontend: Return API endpoint
Frontend: Display API endpoint and usage docs

External Client -> Backend: POST /api/v1/predictions/infer
Backend: Authenticate request
Backend: Load deployed model
Backend: Run inference
Backend -> External Client: Return predictions
```

## Security Architecture

### Authentication & Authorization

1. **User Authentication**: JWT-based token authentication
2. **Password Security**: Bcrypt hashing with salt
3. **Token Expiration**: Configurable token lifetime
4. **API Protection**: All API endpoints require authentication (except login/register)
5. **Resource Ownership**: Users can only access their own resources (or public ones)

### Data Security

1. **Input Validation**: Pydantic schemas validate all inputs
2. **SQL Injection Prevention**: SQLAlchemy ORM parameterized queries
3. **File Upload Security**: 
   - File type validation
   - Size limits
   - Secure file naming
   - Isolated storage

### CORS Configuration

- Configurable allowed origins
- Credentials support
- Appropriate headers

## Scalability Considerations

### Horizontal Scaling

1. **Stateless Backend**: FastAPI instances are stateless, can be load balanced
2. **Database Connection Pooling**: SQLAlchemy connection pool
3. **Redis for Session/Cache**: Shared state across instances
4. **File Storage**: Can migrate to S3/cloud storage for distributed access

### Vertical Scaling

1. **GPU Support**: Training can utilize GPU if available
2. **Async Operations**: FastAPI async/await for concurrent requests
3. **Background Tasks**: Celery for long-running tasks (training)

### Performance Optimization

1. **Database Indexing**: Indexed foreign keys and frequently queried fields
2. **Pagination**: All list endpoints support pagination
3. **Caching**: Redis for frequently accessed data
4. **Image Optimization**: Thumbnail generation, lazy loading
5. **Model Loading**: Cache loaded models in memory

## Deployment Architecture

### Development Environment

```
docker-compose.yml:
- Frontend (dev server, hot reload)
- Backend (uvicorn reload mode)
- PostgreSQL
- Redis
```

### Production Environment

```
Recommended:
- Frontend: Vercel/Netlify or static hosting
- Backend: Kubernetes/ECS with multiple replicas
- Database: Managed PostgreSQL (RDS/CloudSQL)
- Redis: Managed Redis (ElastiCache/MemoryStore)
- File Storage: S3/GCS/Azure Blob Storage
- Load Balancer: ALB/NGINX
- SSL/TLS: Let's Encrypt or cloud provider
- Monitoring: Prometheus + Grafana
- Logging: ELK Stack or cloud logging
```

## Future Enhancements

1. **Real-time Collaboration**: Multiple users labeling same dataset
2. **Advanced Labeling**: Polygon and keypoint annotations
3. **Auto-labeling**: Pre-label with existing models
4. **Dataset Augmentation**: Built-in augmentation pipeline
5. **Model Comparison**: Side-by-side model performance
6. **Export Formats**: Support for other formats (COCO, PASCAL VOC)
7. **Video Support**: Frame extraction and video annotation
8. **Team Management**: Organizations and team collaboration
9. **API Rate Limiting**: Prevent abuse
10. **Webhooks**: Notify on training completion

## Monitoring & Logging

### Application Metrics

- Request latency
- Error rates
- Training job status
- Model inference time
- Database query performance

### Logging

- Structured logging (JSON format)
- Log levels (DEBUG, INFO, WARNING, ERROR)
- Request/response logging
- Training logs
- Error tracking

### Health Checks

- Database connectivity
- Redis connectivity
- Disk space
- Memory usage
- Model availability

## Backup & Recovery

1. **Database Backups**: Regular PostgreSQL backups
2. **File Backups**: Regular backups of uploads/models/datasets
3. **Disaster Recovery**: Documented recovery procedures
4. **Data Retention**: Configurable retention policies

## Conclusion

This architecture provides a solid foundation for a production-ready YOLO training platform with room for growth and enhancement. The modular design allows for easy maintenance, testing, and scaling.
