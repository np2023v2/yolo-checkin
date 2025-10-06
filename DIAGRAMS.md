# System Flow Diagrams

## User Registration and Login Flow

```
┌──────────┐         ┌──────────┐         ┌──────────┐
│          │         │          │         │          │
│  User    │────────▶│ Frontend │────────▶│ Backend  │
│          │         │          │         │   API    │
└──────────┘         └──────────┘         └────┬─────┘
                                                │
                                                │ Hash password
                                                │ Generate JWT
                                                │
                                          ┌─────▼─────┐
                                          │           │
                                          │PostgreSQL │
                                          │           │
                                          └───────────┘
```

## Dataset Creation and Labeling Flow

```
1. Create Dataset
   User ─▶ Frontend ─▶ API ─▶ Database
                            └─▶ Create directories

2. Upload Images
   User ─▶ Select Files ─▶ API ─▶ Save to filesystem
                              └─▶ Store metadata in DB

3. Label Images
   User ─▶ Draw Boxes ─▶ Frontend ─▶ API ─▶ Store annotations
                                        └─▶ Update image status

4. View Statistics
   User ─▶ Request ─▶ API ─▶ Query DB ─▶ Aggregate data
                         └─▶ Return stats
```

## Model Training Flow

```
┌──────────────────────────────────────────────────────────┐
│ Training Job Creation                                     │
└────────────┬─────────────────────────────────────────────┘
             │
             ▼
   ┌─────────────────┐
   │ Validate Inputs │
   │ - Dataset exists│
   │ - Has labels    │
   │ - Model type    │
   └────────┬────────┘
            │
            ▼
   ┌─────────────────┐         ┌──────────────┐
   │ Create Job      │────────▶│ Save to DB   │
   │ Status: PENDING │         │ (job_id=123) │
   └────────┬────────┘         └──────────────┘
            │
            ▼
   ┌─────────────────┐
   │ Start Background│
   │ Task            │
   └────────┬────────┘
            │
┌───────────▼────────────┐
│ Background Training    │
├────────────────────────┤
│ 1. Update status:      │
│    RUNNING             │
│                        │
│ 2. Prepare dataset     │
│    - Create YAML       │
│    - Organize files    │
│    - Create splits     │
│                        │
│ 3. Initialize YOLO     │
│    - Load base model   │
│    - Configure params  │
│                        │
│ 4. Train model         │
│    - Run epochs        │
│    - Update progress   │
│    - Save checkpoints  │
│                        │
│ 5. Save best model     │
│    - Store file path   │
│    - Update metrics    │
│                        │
│ 6. Update status:      │
│    COMPLETED           │
└────────────────────────┘
```

## Inference Flow

```
┌────────────┐
│ User       │
│ uploads    │
│ test image │
└──────┬─────┘
       │
       ▼
┌────────────────┐
│ Frontend       │
│ - Select model │
│ - Set confidence│
└──────┬─────────┘
       │
       ▼
┌────────────────────────────┐
│ Backend API                │
│ 1. Validate model exists   │
│ 2. Check deployment status │
│ 3. Save temp file          │
└──────┬─────────────────────┘
       │
       ▼
┌────────────────────────────┐
│ Load YOLO Model            │
│ - Check cache              │
│ - Load from file if needed │
└──────┬─────────────────────┘
       │
       ▼
┌────────────────────────────┐
│ Run Inference              │
│ - Process image            │
│ - Detect objects           │
│ - Filter by confidence     │
│ - Apply NMS                │
└──────┬─────────────────────┘
       │
       ▼
┌────────────────────────────┐
│ Format Results             │
│ - Bounding boxes           │
│ - Class labels             │
│ - Confidence scores        │
│ - Inference time           │
└──────┬─────────────────────┘
       │
       ▼
┌────────────────────────────┐
│ Return to Frontend         │
│ - Display boxes on image   │
│ - Show detection list      │
│ - Show metrics             │
└────────────────────────────┘
```

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend Layer                       │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ React    │  │ Axios    │  │ State    │  │ Canvas   │   │
│  │ Pages    │  │ HTTP     │  │ Mgmt     │  │ Drawing  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└───────────────────────────┬──────────────────────────────────┘
                            │
                    ┌───────▼───────┐
                    │  REST API     │
                    │  JWT Auth     │
                    │  JSON Data    │
                    └───────┬───────┘
                            │
┌───────────────────────────▼──────────────────────────────────┐
│                        Backend Layer                          │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ FastAPI  │  │ Pydantic │  │ SQLAlch  │  │  YOLO    │   │
│  │ Routes   │  │ Schemas  │  │   ORM    │  │ Training │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└───────────────────────────┬──────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
    ┌───────▼───────┐ ┌────▼────┐ ┌────────▼────────┐
    │  PostgreSQL   │ │  Redis  │ │  File Storage   │
    │               │ │         │ │                 │
    │  - Users      │ │ - Cache │ │  - Images       │
    │  - Datasets   │ │ - Jobs  │ │  - Models       │
    │  - Images     │ │         │ │  - Annotations  │
    │  - Annotations│ │         │ │                 │
    │  - Models     │ │         │ │                 │
    │  - Jobs       │ │         │ │                 │
    └───────────────┘ └─────────┘ └─────────────────┘
```

## API Request/Response Flow

```
1. Authentication
   POST /api/v1/auth/login
   ┌─────────────────┐
   │ Request Body    │
   │ username: "xxx" │
   │ password: "yyy" │
   └────────┬────────┘
            │
            ▼
   ┌─────────────────┐
   │ Verify Password │
   │ Generate Token  │
   └────────┬────────┘
            │
            ▼
   ┌─────────────────┐
   │ Response        │
   │ access_token    │
   │ token_type      │
   └─────────────────┘

2. Protected Resource
   GET /api/v1/datasets/
   ┌─────────────────────────┐
   │ Request Headers         │
   │ Authorization: Bearer..│
   └────────┬────────────────┘
            │
            ▼
   ┌─────────────────┐
   │ Decode Token    │
   │ Validate User   │
   └────────┬────────┘
            │
            ▼
   ┌─────────────────┐
   │ Query Database  │
   │ Filter by User  │
   └────────┬────────┘
            │
            ▼
   ┌─────────────────┐
   │ Response        │
   │ [datasets...]   │
   └─────────────────┘
```

## Database Schema Relationships

```
┌──────────┐
│  users   │
└────┬─────┘
     │
     │ owns
     │
     ├────────────────────┬────────────────┐
     │                    │                │
     ▼                    ▼                ▼
┌──────────┐         ┌──────────┐    ┌──────────┐
│ datasets │         │  models  │    │ training │
└────┬─────┘         └────┬─────┘    │   jobs   │
     │                    │           └────┬─────┘
     │ contains           │                │
     │                    │                │
     ▼                    │                │
┌──────────────┐          │                │
│dataset_images│          │                │
└────┬─────────┘          │                │
     │                    │                │
     │ has                │ references     │ uses
     │                    │                │
     ▼                    ▼                ▼
┌──────────────┐    ┌─────────────────────────┐
│ annotations  │    │    (relationships)       │
└──────────────┘    └─────────────────────────┘
```

## File Storage Organization

```
yolo-trainer/
├── uploads/
│   └── (temporary files)
│
├── datasets/
│   ├── 1/
│   │   ├── images/
│   │   │   ├── img1.jpg
│   │   │   └── img2.jpg
│   │   ├── labels/
│   │   │   ├── img1.txt
│   │   │   └── img2.txt
│   │   ├── train/
│   │   │   ├── images/ (symlinks)
│   │   │   └── labels/
│   │   ├── val/
│   │   │   ├── images/ (symlinks)
│   │   │   └── labels/
│   │   └── data.yaml
│   └── 2/
│       └── ...
│
└── models/
    ├── 1/
    │   ├── train_1/
    │   │   ├── weights/
    │   │   │   ├── best.pt
    │   │   │   └── last.pt
    │   │   ├── results.png
    │   │   └── confusion_matrix.png
    │   └── train_2/
    │       └── ...
    └── 2/
        └── ...
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Production Setup                      │
└─────────────────────────────────────────────────────────┘

┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │
       │ HTTPS
       │
┌──────▼──────┐
│Load Balancer│
│  (NGINX)    │
└──────┬──────┘
       │
       ├─────────────────┬─────────────────┐
       │                 │                 │
┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
│  Frontend   │   │  Frontend   │   │  Frontend   │
│  Instance 1 │   │  Instance 2 │   │  Instance 3 │
└─────────────┘   └─────────────┘   └─────────────┘
       │                 │                 │
       └─────────────────┼─────────────────┘
                         │
                  ┌──────▼──────┐
                  │   Backend   │
                  │Load Balancer│
                  └──────┬──────┘
                         │
       ┌─────────────────┼─────────────────┐
       │                 │                 │
┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
│  Backend    │   │  Backend    │   │  Backend    │
│  Instance 1 │   │  Instance 2 │   │  Instance 3 │
└─────────────┘   └─────────────┘   └─────────────┘
       │                 │                 │
       └─────────────────┼─────────────────┘
                         │
       ┌─────────────────┼─────────────────┐
       │                 │                 │
┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
│ PostgreSQL  │   │    Redis    │   │     S3      │
│  (Primary)  │   │   Cluster   │   │   Storage   │
│             │   │             │   │             │
│ (Replica)   │   │             │   │             │
└─────────────┘   └─────────────┘   └─────────────┘
```

## Security Flow

```
┌──────────────────────────────────────────────────────────┐
│                    Security Layers                        │
└──────────────────────────────────────────────────────────┘

1. HTTPS/TLS
   ├─ Encrypted communication
   └─ Certificate validation

2. Authentication
   ├─ JWT tokens
   ├─ Password hashing (bcrypt)
   └─ Token expiration

3. Authorization
   ├─ Resource ownership check
   ├─ Public/private access
   └─ Role-based permissions

4. Input Validation
   ├─ Pydantic schemas
   ├─ File type checking
   ├─ Size limits
   └─ SQL injection prevention

5. Data Protection
   ├─ Environment variables
   ├─ Secret management
   └─ Secure file storage
```
