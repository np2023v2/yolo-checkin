# API Usage Examples

This directory contains example scripts demonstrating how to interact with the YOLO Trainer Platform API.

## api_usage.py

A comprehensive Python script showing the complete workflow:

1. User registration and authentication
2. Dataset creation
3. Image upload
4. Annotation creation
5. Model creation
6. Training job management
7. Model deployment
8. Inference

### Usage

```bash
# Install dependencies
pip install requests

# Make sure the backend is running
# docker-compose up -d

# Run the example
python api_usage.py
```

### Customization

Edit the configuration at the top of the script:

```python
API_BASE_URL = "http://localhost:8000/api/v1"
USERNAME = "demo_user"
EMAIL = "demo@example.com"
PASSWORD = "demo_password_123"
```

### Full Workflow Example

To run the complete workflow with your own images:

1. Prepare your images in a directory
2. Modify the script to point to your image directory
3. Uncomment the training and inference sections
4. Run the script

```python
# Add to the script
image_path = "path/to/your/image.jpg"
if os.path.exists(image_path):
    image_id = upload_image(dataset_id, image_path, split="train")
    if image_id:
        # Create annotation (bbox: x_center, y_center, width, height, all normalized 0-1)
        create_annotation(dataset_id, image_id, 0, "object", (0.5, 0.5, 0.3, 0.4))

# Uncomment the training section
job_id = create_training_job(dataset_id, model_id, epochs=10, batch_size=16)
monitor_training(job_id)

# Uncomment inference section
deploy_model(model_id)
test_image = "path/to/test/image.jpg"
result = run_inference(model_id, test_image)
```

## More Examples

### JavaScript/Node.js Example

```javascript
const axios = require('axios');

const API_BASE_URL = 'http://localhost:8000/api/v1';

// Login
async function login(username, password) {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);
  
  const response = await axios.post(`${API_BASE_URL}/auth/login`, formData);
  return response.data.access_token;
}

// Create dataset
async function createDataset(token, name, description) {
  const response = await axios.post(
    `${API_BASE_URL}/datasets/`,
    { name, description, is_public: false },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
}

// Run inference
async function runInference(token, modelId, imagePath) {
  const formData = new FormData();
  formData.append('file', fs.createReadStream(imagePath));
  
  const response = await axios.post(
    `${API_BASE_URL}/predictions/infer`,
    formData,
    {
      params: { model_id: modelId, confidence: 0.25 },
      headers: { 
        Authorization: `Bearer ${token}`,
        ...formData.getHeaders()
      }
    }
  );
  return response.data;
}
```

### cURL Examples

```bash
# Login
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=demo_user&password=demo_password_123"

# Create dataset (replace TOKEN with your JWT token)
curl -X POST "http://localhost:8000/api/v1/datasets/" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Dataset",
    "description": "Test dataset",
    "is_public": false
  }'

# Upload image
curl -X POST "http://localhost:8000/api/v1/datasets/1/images" \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@image.jpg" \
  -F "split=train"

# Create annotation
curl -X POST "http://localhost:8000/api/v1/datasets/1/images/1/annotations" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "image_id": 1,
    "class_id": 0,
    "class_name": "object",
    "x_center": 0.5,
    "y_center": 0.5,
    "width": 0.3,
    "height": 0.4,
    "confidence": 1.0
  }'

# Start training
curl -X POST "http://localhost:8000/api/v1/training/" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dataset_id": 1,
    "model_id": 1,
    "epochs": 10,
    "batch_size": 16,
    "img_size": 640,
    "learning_rate": 0.01,
    "patience": 50
  }'

# Check training status
curl -X GET "http://localhost:8000/api/v1/training/1" \
  -H "Authorization: Bearer TOKEN"

# Deploy model
curl -X POST "http://localhost:8000/api/v1/models/1/deploy" \
  -H "Authorization: Bearer TOKEN"

# Run inference
curl -X POST "http://localhost:8000/api/v1/predictions/infer?model_id=1&confidence=0.25" \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@test_image.jpg"
```

## API Reference

For complete API documentation, visit:
http://localhost:8000/api/v1/docs

## Contributing

Feel free to add more examples! See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.
