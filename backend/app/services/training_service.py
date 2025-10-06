from ultralytics import YOLO
from app.db.session import SessionLocal
from app.models.models import TrainingJob, Dataset, Model, DatasetImage, Annotation, TrainingStatus
from app.core.config import settings
import os
import yaml
from datetime import datetime
import traceback


def prepare_yolo_dataset(dataset_id: int, db):
    """Prepare dataset in YOLO format."""
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise ValueError("Dataset not found")
    
    dataset_dir = os.path.join(settings.DATASET_DIR, str(dataset_id))
    
    # Get all images with their annotations
    images = db.query(DatasetImage).filter(
        DatasetImage.dataset_id == dataset_id,
        DatasetImage.is_labeled == True
    ).all()
    
    if not images:
        raise ValueError("No labeled images found in dataset")
    
    # Create YOLO format directory structure
    train_img_dir = os.path.join(dataset_dir, "train", "images")
    train_label_dir = os.path.join(dataset_dir, "train", "labels")
    val_img_dir = os.path.join(dataset_dir, "val", "images")
    val_label_dir = os.path.join(dataset_dir, "val", "labels")
    
    os.makedirs(train_img_dir, exist_ok=True)
    os.makedirs(train_label_dir, exist_ok=True)
    os.makedirs(val_img_dir, exist_ok=True)
    os.makedirs(val_label_dir, exist_ok=True)
    
    # Collect class names
    class_names = set()
    for image in images:
        annotations = db.query(Annotation).filter(Annotation.image_id == image.id).all()
        for ann in annotations:
            class_names.add(ann.class_name)
    
    class_names = sorted(list(class_names))
    class_name_to_id = {name: idx for idx, name in enumerate(class_names)}
    
    # Update dataset with class information
    dataset.num_classes = len(class_names)
    dataset.class_names = class_names
    db.commit()
    
    # Write annotations in YOLO format
    for image in images:
        # Determine split directory
        if image.split == "val":
            img_dir = val_img_dir
            label_dir = val_label_dir
        else:  # default to train
            img_dir = train_img_dir
            label_dir = train_label_dir
        
        # Copy image if needed (or use existing path)
        # In this case, we'll reference the original location
        
        # Create label file
        label_file = os.path.join(label_dir, os.path.splitext(image.filename)[0] + ".txt")
        annotations = db.query(Annotation).filter(Annotation.image_id == image.id).all()
        
        with open(label_file, "w") as f:
            for ann in annotations:
                class_id = class_name_to_id[ann.class_name]
                # YOLO format: class_id x_center y_center width height (all normalized)
                f.write(f"{class_id} {ann.x_center} {ann.y_center} {ann.width} {ann.height}\n")
        
        # Create symlink or copy image
        img_dest = os.path.join(img_dir, image.filename)
        if not os.path.exists(img_dest):
            if os.path.exists(image.file_path):
                os.symlink(image.file_path, img_dest)
    
    # Create data.yaml file
    data_yaml = {
        "path": dataset_dir,
        "train": "train/images",
        "val": "val/images",
        "nc": len(class_names),
        "names": class_names
    }
    
    yaml_path = os.path.join(dataset_dir, "data.yaml")
    with open(yaml_path, "w") as f:
        yaml.dump(data_yaml, f)
    
    return yaml_path, class_names


def train_yolo_model(job_id: int):
    """Train a YOLO model (runs in background)."""
    db = SessionLocal()
    
    try:
        # Get training job
        job = db.query(TrainingJob).filter(TrainingJob.id == job_id).first()
        if not job:
            return
        
        # Update status
        job.status = TrainingStatus.RUNNING
        job.started_at = datetime.utcnow()
        db.commit()
        
        # Get model
        model = db.query(Model).filter(Model.id == job.model_id).first()
        if not model:
            raise ValueError("Model not found")
        
        # Prepare dataset
        data_yaml_path, class_names = prepare_yolo_dataset(job.dataset_id, db)
        
        # Initialize YOLO model
        yolo_model = YOLO(f"{model.model_type}.pt")  # e.g., yolov8n.pt
        
        # Train model
        results = yolo_model.train(
            data=data_yaml_path,
            epochs=job.epochs,
            batch=job.batch_size,
            imgsz=job.img_size,
            lr0=job.learning_rate,
            patience=job.patience,
            project=os.path.join(settings.MODEL_DIR, str(model.id)),
            name=f"train_{job.id}",
            exist_ok=True,
            verbose=True
        )
        
        # Get best model path
        best_model_path = os.path.join(
            settings.MODEL_DIR,
            str(model.id),
            f"train_{job.id}",
            "weights",
            "best.pt"
        )
        
        if os.path.exists(best_model_path):
            # Update model with trained weights
            model.file_path = best_model_path
            model.num_classes = len(class_names)
            model.class_names = class_names
            
            # Get metrics
            if hasattr(results, 'results_dict'):
                model.metrics = results.results_dict
            
            db.commit()
        
        # Update job status
        job.status = TrainingStatus.COMPLETED
        job.completed_at = datetime.utcnow()
        job.current_epoch = job.epochs
        
        if hasattr(results, 'results_dict') and 'metrics/mAP50-95(B)' in results.results_dict:
            job.best_map = results.results_dict['metrics/mAP50-95(B)']
        
        training_time = (job.completed_at - job.started_at).total_seconds()
        job.training_time = training_time
        job.logs = f"Training completed successfully in {training_time:.2f} seconds"
        
        db.commit()
        
    except Exception as e:
        # Update job with error
        job.status = TrainingStatus.FAILED
        job.completed_at = datetime.utcnow()
        job.error_message = str(e)
        job.logs = traceback.format_exc()
        db.commit()
    
    finally:
        db.close()
