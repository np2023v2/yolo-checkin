#!/usr/bin/env python3
"""
Example script demonstrating how to use the YOLO Trainer Platform API.

This script shows how to:
1. Register/login a user
2. Create a dataset
3. Upload images
4. Create annotations
5. Create and train a model
6. Run inference

Requirements:
    pip install requests
"""

import requests
import os
import time
from pathlib import Path

# Configuration
API_BASE_URL = "http://localhost:8000/api/v1"
USERNAME = "demo_user"
EMAIL = "demo@example.com"
PASSWORD = "demo_password_123"

# Store token globally
TOKEN = None


def set_auth_header():
    """Return headers with authentication token."""
    if TOKEN:
        return {"Authorization": f"Bearer {TOKEN}"}
    return {}


def register_user():
    """Register a new user."""
    print("Registering user...")
    response = requests.post(
        f"{API_BASE_URL}/auth/register",
        json={
            "username": USERNAME,
            "email": EMAIL,
            "password": PASSWORD
        }
    )
    if response.status_code == 200:
        print(f"✓ User registered: {response.json()['username']}")
        return True
    elif response.status_code == 400:
        print("! User already exists, proceeding to login...")
        return True
    else:
        print(f"✗ Registration failed: {response.text}")
        return False


def login_user():
    """Login and get access token."""
    global TOKEN
    print("Logging in...")
    response = requests.post(
        f"{API_BASE_URL}/auth/login",
        data={
            "username": USERNAME,
            "password": PASSWORD
        }
    )
    if response.status_code == 200:
        TOKEN = response.json()["access_token"]
        print("✓ Login successful")
        return True
    else:
        print(f"✗ Login failed: {response.text}")
        return False


def create_dataset(name, description):
    """Create a new dataset."""
    print(f"Creating dataset '{name}'...")
    response = requests.post(
        f"{API_BASE_URL}/datasets/",
        json={
            "name": name,
            "description": description,
            "is_public": False
        },
        headers=set_auth_header()
    )
    if response.status_code == 200:
        dataset = response.json()
        print(f"✓ Dataset created with ID: {dataset['id']}")
        return dataset['id']
    else:
        print(f"✗ Dataset creation failed: {response.text}")
        return None


def upload_image(dataset_id, image_path, split="train"):
    """Upload an image to a dataset."""
    print(f"Uploading image '{image_path}'...")
    with open(image_path, 'rb') as f:
        files = {'file': (os.path.basename(image_path), f, 'image/jpeg')}
        data = {'split': split}
        response = requests.post(
            f"{API_BASE_URL}/datasets/{dataset_id}/images",
            files=files,
            data=data,
            headers=set_auth_header()
        )
    if response.status_code == 200:
        image = response.json()
        print(f"✓ Image uploaded with ID: {image['id']}")
        return image['id']
    else:
        print(f"✗ Image upload failed: {response.text}")
        return None


def create_annotation(dataset_id, image_id, class_id, class_name, bbox):
    """Create an annotation for an image.
    
    Args:
        bbox: tuple of (x_center, y_center, width, height) normalized 0-1
    """
    print(f"Creating annotation for image {image_id}...")
    response = requests.post(
        f"{API_BASE_URL}/datasets/{dataset_id}/images/{image_id}/annotations",
        json={
            "image_id": image_id,
            "class_id": class_id,
            "class_name": class_name,
            "x_center": bbox[0],
            "y_center": bbox[1],
            "width": bbox[2],
            "height": bbox[3],
            "confidence": 1.0
        },
        headers=set_auth_header()
    )
    if response.status_code == 200:
        annotation = response.json()
        print(f"✓ Annotation created with ID: {annotation['id']}")
        return annotation['id']
    else:
        print(f"✗ Annotation creation failed: {response.text}")
        return None


def create_model(name, model_type="yolov8n"):
    """Create a new model."""
    print(f"Creating model '{name}'...")
    response = requests.post(
        f"{API_BASE_URL}/models/",
        json={
            "name": name,
            "description": "Model created via API",
            "model_type": model_type,
            "is_public": False
        },
        headers=set_auth_header()
    )
    if response.status_code == 200:
        model = response.json()
        print(f"✓ Model created with ID: {model['id']}")
        return model['id']
    else:
        print(f"✗ Model creation failed: {response.text}")
        return None


def create_training_job(dataset_id, model_id, epochs=10, batch_size=16):
    """Create and start a training job."""
    print(f"Creating training job...")
    response = requests.post(
        f"{API_BASE_URL}/training/",
        json={
            "dataset_id": dataset_id,
            "model_id": model_id,
            "epochs": epochs,
            "batch_size": batch_size,
            "img_size": 640,
            "learning_rate": 0.01,
            "patience": 50
        },
        headers=set_auth_header()
    )
    if response.status_code == 200:
        job = response.json()
        print(f"✓ Training job created with ID: {job['id']}")
        return job['id']
    else:
        print(f"✗ Training job creation failed: {response.text}")
        return None


def get_training_status(job_id):
    """Get training job status."""
    response = requests.get(
        f"{API_BASE_URL}/training/{job_id}",
        headers=set_auth_header()
    )
    if response.status_code == 200:
        return response.json()
    else:
        return None


def monitor_training(job_id, check_interval=10):
    """Monitor training progress."""
    print(f"Monitoring training job {job_id}...")
    while True:
        status = get_training_status(job_id)
        if status:
            print(f"Status: {status['status']}, Epoch: {status['current_epoch']}/{status['epochs']}")
            if status['status'] in ['completed', 'failed']:
                print(f"Training {status['status']}")
                if status['status'] == 'completed':
                    print(f"Best mAP: {status.get('best_map', 'N/A')}")
                else:
                    print(f"Error: {status.get('error_message', 'Unknown error')}")
                break
        time.sleep(check_interval)


def deploy_model(model_id):
    """Deploy a model for inference."""
    print(f"Deploying model {model_id}...")
    response = requests.post(
        f"{API_BASE_URL}/models/{model_id}/deploy",
        headers=set_auth_header()
    )
    if response.status_code == 200:
        result = response.json()
        print(f"✓ Model deployed: {result['inference_endpoint']}")
        return True
    else:
        print(f"✗ Model deployment failed: {response.text}")
        return False


def run_inference(model_id, image_path, confidence=0.25):
    """Run inference on an image."""
    print(f"Running inference on '{image_path}'...")
    with open(image_path, 'rb') as f:
        files = {'file': (os.path.basename(image_path), f, 'image/jpeg')}
        response = requests.post(
            f"{API_BASE_URL}/predictions/infer",
            files=files,
            params={'model_id': model_id, 'confidence': confidence},
            headers=set_auth_header()
        )
    if response.status_code == 200:
        result = response.json()
        print(f"✓ Inference completed in {result['inference_time']:.3f}s")
        print(f"  Found {len(result['predictions'])} objects:")
        for pred in result['predictions']:
            print(f"    - {pred['class_name']}: {pred['confidence']:.2f}")
        return result
    else:
        print(f"✗ Inference failed: {response.text}")
        return None


def main():
    """Main function demonstrating the API workflow."""
    print("=" * 60)
    print("YOLO Trainer Platform - API Example")
    print("=" * 60)
    
    # 1. Register and login
    if not register_user():
        return
    if not login_user():
        return
    
    print("\n" + "-" * 60)
    print("Step 1: User authenticated")
    print("-" * 60)
    
    # 2. Create dataset
    dataset_id = create_dataset("API Demo Dataset", "Dataset created via API example")
    if not dataset_id:
        return
    
    print("\n" + "-" * 60)
    print("Step 2: Dataset created")
    print("-" * 60)
    print("\nNote: For this demo to work, you need to:")
    print("1. Upload some images to the dataset")
    print("2. Add annotations to the images")
    print("3. Then proceed with training")
    print("\nYou can do this via the web interface or by providing image paths to this script.")
    print("-" * 60)
    
    # Example of how to upload an image (you need to provide a real image path)
    # image_path = "path/to/your/image.jpg"
    # if os.path.exists(image_path):
    #     image_id = upload_image(dataset_id, image_path, split="train")
    #     if image_id:
    #         # Create annotation (example bounding box)
    #         create_annotation(dataset_id, image_id, 0, "object", (0.5, 0.5, 0.3, 0.4))
    
    # 3. Create model
    model_id = create_model("API Demo Model", "yolov8n")
    if not model_id:
        return
    
    print("\n" + "-" * 60)
    print("Step 3: Model created")
    print("-" * 60)
    
    # 4. Start training (uncomment when you have labeled data)
    # job_id = create_training_job(dataset_id, model_id, epochs=10, batch_size=16)
    # if job_id:
    #     print("\n" + "-" * 60)
    #     print("Step 4: Training started")
    #     print("-" * 60)
    #     monitor_training(job_id)
    #
    #     # 5. Deploy model
    #     if deploy_model(model_id):
    #         print("\n" + "-" * 60)
    #         print("Step 5: Model deployed")
    #         print("-" * 60)
    #
    #         # 6. Run inference (provide a test image path)
    #         # test_image = "path/to/test/image.jpg"
    #         # if os.path.exists(test_image):
    #         #     result = run_inference(model_id, test_image)
    
    print("\n" + "=" * 60)
    print("API Demo completed!")
    print("=" * 60)
    print(f"\nDataset ID: {dataset_id}")
    print(f"Model ID: {model_id}")
    print("\nNext steps:")
    print("1. Upload images to your dataset via the web interface")
    print("2. Label the images")
    print("3. Uncomment the training code above and run again")
    print("4. Test your trained model!")


if __name__ == "__main__":
    main()
