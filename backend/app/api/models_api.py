from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.api.auth import get_current_user
from app.models.models import User, Model
from app.schemas.schemas import Model as ModelSchema, ModelCreate, ModelUpdate
from app.core.config import settings
import os
import shutil

router = APIRouter()


@router.post("/", response_model=ModelSchema)
def create_model(
    model: ModelCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new model entry."""
    db_model = Model(
        name=model.name,
        description=model.description,
        model_type=model.model_type,
        is_public=model.is_public,
        owner_id=current_user.id
    )
    db.add(db_model)
    db.commit()
    db.refresh(db_model)
    
    return db_model


@router.get("/", response_model=List[ModelSchema])
def list_models(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all models accessible to current user."""
    models = db.query(Model).filter(
        (Model.owner_id == current_user.id) | (Model.is_public == True)
    ).offset(skip).limit(limit).all()
    return models


@router.get("/{model_id}", response_model=ModelSchema)
def get_model(
    model_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get model by ID."""
    model = db.query(Model).filter(Model.id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    
    if model.owner_id != current_user.id and not model.is_public:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return model


@router.put("/{model_id}", response_model=ModelSchema)
def update_model(
    model_id: int,
    model_update: ModelUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update model."""
    model = db.query(Model).filter(Model.id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    
    if model.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    update_data = model_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(model, field, value)
    
    db.commit()
    db.refresh(model)
    return model


@router.delete("/{model_id}")
def delete_model(
    model_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete model."""
    model = db.query(Model).filter(Model.id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    
    if model.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Delete model file
    if model.file_path and os.path.exists(model.file_path):
        os.remove(model.file_path)
    
    db.delete(model)
    db.commit()
    
    return {"message": "Model deleted successfully"}


@router.post("/{model_id}/upload")
async def upload_model_file(
    model_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a custom model file."""
    model = db.query(Model).filter(Model.id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    
    if model.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Validate file extension
    if not file.filename.endswith(('.pt', '.pth')):
        raise HTTPException(
            status_code=400,
            detail="Invalid file format. Only .pt and .pth files are allowed"
        )
    
    # Save file
    model_dir = os.path.join(settings.MODEL_DIR, str(model_id))
    os.makedirs(model_dir, exist_ok=True)
    file_path = os.path.join(model_dir, file.filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Update model
    model.file_path = file_path
    db.commit()
    
    return {"message": "Model file uploaded successfully", "file_path": file_path}


@router.get("/{model_id}/download")
def download_model(
    model_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get download URL for model file."""
    model = db.query(Model).filter(Model.id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    
    if model.owner_id != current_user.id and not model.is_public:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if not model.file_path or not os.path.exists(model.file_path):
        raise HTTPException(status_code=404, detail="Model file not found")
    
    return {
        "download_url": f"{settings.API_V1_STR}/models/{model_id}/file",
        "filename": os.path.basename(model.file_path)
    }


@router.post("/{model_id}/deploy")
def deploy_model(
    model_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deploy model for inference API."""
    model = db.query(Model).filter(Model.id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    
    if model.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if not model.file_path or not os.path.exists(model.file_path):
        raise HTTPException(status_code=400, detail="Model file not found. Upload or train a model first.")
    
    model.is_deployed = True
    db.commit()
    
    return {
        "message": "Model deployed successfully",
        "inference_endpoint": f"{settings.API_V1_STR}/predictions/infer"
    }


@router.post("/{model_id}/undeploy")
def undeploy_model(
    model_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Undeploy model from inference API."""
    model = db.query(Model).filter(Model.id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    
    if model.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    model.is_deployed = False
    db.commit()
    
    return {"message": "Model undeployed successfully"}
