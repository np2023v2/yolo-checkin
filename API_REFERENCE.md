# API Reference

Complete API reference for the YOLO Trainer Platform.

**Base URL**: `http://localhost:8000/api/v1`  
**Authentication**: JWT Bearer Token  
**Interactive Docs**: `http://localhost:8000/api/v1/docs`

## Table of Contents

1. [Authentication](#authentication)
2. [Datasets](#datasets)
3. [Models](#models)
4. [Training](#training)
5. [Predictions](#predictions)
6. [Error Responses](#error-responses)

---

## Authentication

### Register User

Create a new user account.

**Endpoint**: `POST /auth/register`  
**Auth Required**: No

**Request Body**:
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "secure_password"
}
```

**Response**: `200 OK`
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "username",
  "is_active": true,
  "is_superuser": false,
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Login

Authenticate and receive access token.

**Endpoint**: `POST /auth/login`  
**Auth Required**: No  
**Content-Type**: `application/x-www-form-urlencoded`

**Request Body**:
```
username=username&password=secure_password
```

**Response**: `200 OK`
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer"
}
```

### Get Current User

Get authenticated user information.

**Endpoint**: `GET /auth/me`  
**Auth Required**: Yes

**Response**: `200 OK`
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "username",
  "is_active": true,
  "is_superuser": false,
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

## Datasets

### List Datasets

Get all datasets accessible to the user.

**Endpoint**: `GET /datasets/`  
**Auth Required**: Yes

**Query Parameters**:
- `skip` (integer, optional): Number of records to skip (default: 0)
- `limit` (integer, optional): Maximum records to return (default: 100)

**Response**: `200 OK`
```json
[
  {
    "id": 1,
    "name": "My Dataset",
    "description": "Dataset for object detection",
    "owner_id": 1,
    "num_classes": 3,
    "num_images": 150,
    "class_names": ["car", "person", "dog"],
    "is_public": false,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-02T00:00:00Z"
  }
]
```

### Create Dataset

Create a new dataset.

**Endpoint**: `POST /datasets/`  
**Auth Required**: Yes

**Request Body**:
```json
{
  "name": "My Dataset",
  "description": "Dataset for object detection",
  "is_public": false
}
```

**Response**: `200 OK`
```json
{
  "id": 1,
  "name": "My Dataset",
  "description": "Dataset for object detection",
  "owner_id": 1,
  "num_classes": 0,
  "num_images": 0,
  "class_names": null,
  "is_public": false,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": null
}
```

### Get Dataset

Get a specific dataset by ID.

**Endpoint**: `GET /datasets/{dataset_id}`  
**Auth Required**: Yes

**Response**: `200 OK`
```json
{
  "id": 1,
  "name": "My Dataset",
  "description": "Dataset for object detection",
  "owner_id": 1,
  "num_classes": 3,
  "num_images": 150,
  "class_names": ["car", "person", "dog"],
  "is_public": false,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-02T00:00:00Z"
}
```

### Update Dataset

Update dataset information.

**Endpoint**: `PUT /datasets/{dataset_id}`  
**Auth Required**: Yes (must be owner)

**Request Body**:
```json
{
  "name": "Updated Dataset Name",
  "description": "Updated description",
  "is_public": true,
  "class_names": ["car", "person", "dog", "cat"]
}
```

**Response**: `200 OK` (returns updated dataset)

### Delete Dataset

Delete a dataset and all associated data.

**Endpoint**: `DELETE /datasets/{dataset_id}`  
**Auth Required**: Yes (must be owner)

**Response**: `200 OK`
```json
{
  "message": "Dataset deleted successfully"
}
```

### Upload Image

Upload an image to a dataset.

**Endpoint**: `POST /datasets/{dataset_id}/images`  
**Auth Required**: Yes (must be owner)  
**Content-Type**: `multipart/form-data`

**Form Data**:
- `file`: Image file (JPEG, PNG)
- `split`: "train", "val", or "test" (default: "train")

**Response**: `200 OK`
```json
{
  "id": 1,
  "dataset_id": 1,
  "filename": "image001.jpg",
  "file_path": "/datasets/1/images/image001.jpg",
  "width": 1920,
  "height": 1080,
  "is_labeled": false,
  "split": "train",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### List Images

Get all images in a dataset.

**Endpoint**: `GET /datasets/{dataset_id}/images`  
**Auth Required**: Yes

**Query Parameters**:
- `skip` (integer, optional): Number of records to skip
- `limit` (integer, optional): Maximum records to return
- `split` (string, optional): Filter by split ("train", "val", "test")

**Response**: `200 OK` (array of images)

### Create Annotation

Add a bounding box annotation to an image.

**Endpoint**: `POST /datasets/{dataset_id}/images/{image_id}/annotations`  
**Auth Required**: Yes (must be owner)

**Request Body**:
```json
{
  "image_id": 1,
  "class_id": 0,
  "class_name": "car",
  "x_center": 0.5,
  "y_center": 0.5,
  "width": 0.3,
  "height": 0.4,
  "confidence": 1.0
}
```

**Note**: All coordinates are normalized (0.0 to 1.0)

**Response**: `200 OK`
```json
{
  "id": 1,
  "image_id": 1,
  "class_id": 0,
  "class_name": "car",
  "x_center": 0.5,
  "y_center": 0.5,
  "width": 0.3,
  "height": 0.4,
  "confidence": 1.0,
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Get Annotations

Get all annotations for an image.

**Endpoint**: `GET /datasets/{dataset_id}/images/{image_id}/annotations`  
**Auth Required**: Yes

**Response**: `200 OK` (array of annotations)

### Delete Annotation

Delete a specific annotation.

**Endpoint**: `DELETE /datasets/{dataset_id}/annotations/{annotation_id}`  
**Auth Required**: Yes (must be owner)

**Response**: `200 OK`
```json
{
  "message": "Annotation deleted successfully"
}
```

### Get Dataset Statistics

Get comprehensive statistics for a dataset.

**Endpoint**: `GET /datasets/{dataset_id}/statistics`  
**Auth Required**: Yes

**Response**: `200 OK`
```json
{
  "total_images": 150,
  "train_images": 100,
  "val_images": 30,
  "test_images": 20,
  "labeled_images": 145,
  "unlabeled_images": 5,
  "class_distribution": {
    "car": 350,
    "person": 280,
    "dog": 120
  }
}
```

---

## Models

### List Models

Get all models accessible to the user.

**Endpoint**: `GET /models/`  
**Auth Required**: Yes

**Query Parameters**:
- `skip` (integer, optional): Number of records to skip
- `limit` (integer, optional): Maximum records to return

**Response**: `200 OK` (array of models)

### Create Model

Create a new model entry.

**Endpoint**: `POST /models/`  
**Auth Required**: Yes

**Request Body**:
```json
{
  "name": "My YOLOv8 Model",
  "description": "Object detection model",
  "model_type": "yolov8n",
  "is_public": false
}
```

**Model Types**: `yolov8n`, `yolov8s`, `yolov8m`, `yolov8l`, `yolov8x`

**Response**: `200 OK`
```json
{
  "id": 1,
  "name": "My YOLOv8 Model",
  "description": "Object detection model",
  "owner_id": 1,
  "model_type": "yolov8n",
  "file_path": null,
  "num_classes": null,
  "class_names": null,
  "metrics": null,
  "is_public": false,
  "is_deployed": false,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": null
}
```

### Get Model

Get a specific model by ID.

**Endpoint**: `GET /models/{model_id}`  
**Auth Required**: Yes

**Response**: `200 OK` (model object)

### Update Model

Update model information.

**Endpoint**: `PUT /models/{model_id}`  
**Auth Required**: Yes (must be owner)

**Request Body**:
```json
{
  "name": "Updated Model Name",
  "description": "Updated description",
  "is_public": true,
  "is_deployed": false
}
```

**Response**: `200 OK` (updated model)

### Delete Model

Delete a model and its files.

**Endpoint**: `DELETE /models/{model_id}`  
**Auth Required**: Yes (must be owner)

**Response**: `200 OK`
```json
{
  "message": "Model deleted successfully"
}
```

### Upload Model File

Upload a custom trained model file.

**Endpoint**: `POST /models/{model_id}/upload`  
**Auth Required**: Yes (must be owner)  
**Content-Type**: `multipart/form-data`

**Form Data**:
- `file`: Model file (.pt or .pth)

**Response**: `200 OK`
```json
{
  "message": "Model file uploaded successfully",
  "file_path": "/models/1/custom_model.pt"
}
```

### Download Model

Get download information for a model.

**Endpoint**: `GET /models/{model_id}/download`  
**Auth Required**: Yes

**Response**: `200 OK`
```json
{
  "download_url": "/api/v1/models/1/file",
  "filename": "best.pt"
}
```

### Deploy Model

Deploy a model for inference.

**Endpoint**: `POST /models/{model_id}/deploy`  
**Auth Required**: Yes (must be owner)

**Response**: `200 OK`
```json
{
  "message": "Model deployed successfully",
  "inference_endpoint": "/api/v1/predictions/infer"
}
```

### Undeploy Model

Remove model from inference service.

**Endpoint**: `POST /models/{model_id}/undeploy`  
**Auth Required**: Yes (must be owner)

**Response**: `200 OK`
```json
{
  "message": "Model undeployed successfully"
}
```

---

## Training

### List Training Jobs

Get all training jobs for the current user.

**Endpoint**: `GET /training/`  
**Auth Required**: Yes

**Query Parameters**:
- `skip` (integer, optional): Number of records to skip
- `limit` (integer, optional): Maximum records to return

**Response**: `200 OK` (array of training jobs)

### Create Training Job

Start a new training job.

**Endpoint**: `POST /training/`  
**Auth Required**: Yes

**Request Body**:
```json
{
  "dataset_id": 1,
  "model_id": 1,
  "epochs": 100,
  "batch_size": 16,
  "img_size": 640,
  "learning_rate": 0.01,
  "patience": 50
}
```

**Response**: `200 OK`
```json
{
  "id": 1,
  "user_id": 1,
  "dataset_id": 1,
  "model_id": 1,
  "status": "pending",
  "epochs": 100,
  "batch_size": 16,
  "img_size": 640,
  "learning_rate": 0.01,
  "patience": 50,
  "current_epoch": 0,
  "best_map": null,
  "training_time": null,
  "logs": null,
  "error_message": null,
  "started_at": null,
  "completed_at": null,
  "created_at": "2024-01-01T00:00:00Z"
}
```

**Status Values**: `pending`, `running`, `completed`, `failed`

### Get Training Job

Get details of a specific training job.

**Endpoint**: `GET /training/{job_id}`  
**Auth Required**: Yes (must be owner)

**Response**: `200 OK` (training job object)

### Cancel/Delete Training Job

Cancel a running job or delete a completed/failed job.

**Endpoint**: `DELETE /training/{job_id}`  
**Auth Required**: Yes (must be owner)

**Response**: `200 OK`
```json
{
  "message": "Training job cancelled"
}
```

### Get Training Logs

Get logs and progress for a training job.

**Endpoint**: `GET /training/{job_id}/logs`  
**Auth Required**: Yes (must be owner)

**Response**: `200 OK`
```json
{
  "job_id": 1,
  "status": "running",
  "current_epoch": 45,
  "total_epochs": 100,
  "best_map": 0.85,
  "logs": "Epoch 45/100: loss=0.023, mAP=0.85..."
}
```

---

## Predictions

### Run Inference

Run object detection on an image.

**Endpoint**: `POST /predictions/infer`  
**Auth Required**: Yes  
**Content-Type**: `multipart/form-data`

**Query Parameters**:
- `model_id` (integer, required): Model to use
- `confidence` (float, optional): Confidence threshold (default: 0.25)
- `iou_threshold` (float, optional): IoU threshold for NMS (default: 0.45)

**Form Data**:
- `file`: Image file

**Response**: `200 OK`
```json
{
  "image_path": "test_image.jpg",
  "predictions": [
    {
      "class_id": 0,
      "class_name": "car",
      "confidence": 0.92,
      "x_min": 100.5,
      "y_min": 50.2,
      "x_max": 300.8,
      "y_max": 200.4
    },
    {
      "class_id": 1,
      "class_name": "person",
      "confidence": 0.87,
      "x_min": 350.1,
      "y_min": 100.5,
      "x_max": 450.3,
      "y_max": 350.8
    }
  ],
  "inference_time": 0.045
}
```

### Test Model

Simplified endpoint for testing a model.

**Endpoint**: `POST /predictions/test/{model_id}`  
**Auth Required**: Yes  
**Content-Type**: `multipart/form-data`

**Form Data**:
- `file`: Image file

**Response**: Same as inference endpoint

---

## Error Responses

### 400 Bad Request

Invalid request data.

```json
{
  "detail": "Validation error message"
}
```

### 401 Unauthorized

Missing or invalid authentication token.

```json
{
  "detail": "Could not validate credentials"
}
```

### 403 Forbidden

User doesn't have permission to access resource.

```json
{
  "detail": "Access denied"
}
```

### 404 Not Found

Resource doesn't exist.

```json
{
  "detail": "Dataset not found"
}
```

### 500 Internal Server Error

Server error.

```json
{
  "detail": "Internal server error message"
}
```

---

## Rate Limiting

Currently no rate limiting is implemented. For production, consider adding rate limiting middleware.

## Pagination

List endpoints support pagination with `skip` and `limit` parameters:

```
GET /api/v1/datasets/?skip=0&limit=10
```

## Filtering

Some endpoints support filtering:

```
GET /api/v1/datasets/{id}/images?split=train
```

## Authentication Header

All authenticated requests must include:

```
Authorization: Bearer <your_jwt_token>
```

## Content Types

- `application/json` for most requests
- `multipart/form-data` for file uploads
- `application/x-www-form-urlencoded` for login

---

For interactive API documentation, visit:  
**http://localhost:8000/api/v1/docs**

This documentation is automatically generated from the code and includes the ability to test endpoints directly.
