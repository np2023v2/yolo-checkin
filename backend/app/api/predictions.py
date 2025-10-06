from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.api.auth import get_current_user
from app.models.models import User, Model
from app.schemas.schemas import PredictionRequest, PredictionResult, BoundingBox
from app.core.config import settings
from ultralytics import YOLO
import os
import time
from PIL import Image
import tempfile

router = APIRouter()


@router.post("/infer", response_model=PredictionResult)
async def infer(
    model_id: int,
    file: UploadFile = File(...),
    confidence: float = 0.25,
    iou_threshold: float = 0.45,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Run inference on an image using a deployed model."""
    # Get model
    model = db.query(Model).filter(Model.id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    
    if model.owner_id != current_user.id and not model.is_public:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if not model.is_deployed:
        raise HTTPException(status_code=400, detail="Model is not deployed")
    
    if not model.file_path or not os.path.exists(model.file_path):
        raise HTTPException(status_code=400, detail="Model file not found")
    
    # Save uploaded file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as tmp_file:
        tmp_file.write(await file.read())
        tmp_path = tmp_file.name
    
    try:
        # Load YOLO model
        yolo_model = YOLO(model.file_path)
        
        # Run inference
        start_time = time.time()
        results = yolo_model.predict(
            source=tmp_path,
            conf=confidence,
            iou=iou_threshold,
            verbose=False
        )
        inference_time = time.time() - start_time
        
        # Parse results
        predictions = []
        if len(results) > 0:
            result = results[0]
            boxes = result.boxes
            
            for i in range(len(boxes)):
                box = boxes.xyxy[i].cpu().numpy()
                class_id = int(boxes.cls[i].cpu().numpy())
                conf = float(boxes.conf[i].cpu().numpy())
                
                # Get class name
                class_name = model.class_names[class_id] if model.class_names and class_id < len(model.class_names) else f"class_{class_id}"
                
                predictions.append(BoundingBox(
                    class_id=class_id,
                    class_name=class_name,
                    confidence=conf,
                    x_min=float(box[0]),
                    y_min=float(box[1]),
                    x_max=float(box[2]),
                    y_max=float(box[3])
                ))
        
        return PredictionResult(
            image_path=file.filename,
            predictions=predictions,
            inference_time=inference_time
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference failed: {str(e)}")
    
    finally:
        # Clean up temporary file
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


@router.post("/test/{model_id}")
async def test_model(
    model_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Test a model with an uploaded image."""
    return await infer(model_id, file, 0.25, 0.45, current_user, db)
