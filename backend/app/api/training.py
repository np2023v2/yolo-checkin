from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.api.auth import get_current_user
from app.models.models import User, TrainingJob, Dataset, Model, TrainingStatus
from app.schemas.schemas import TrainingJob as TrainingJobSchema, TrainingJobCreate
from app.services.training_service import train_yolo_model
from datetime import datetime

router = APIRouter()


@router.post("/", response_model=TrainingJobSchema)
def create_training_job(
    job: TrainingJobCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create and start a new training job."""
    # Verify dataset exists and user has access
    dataset = db.query(Dataset).filter(Dataset.id == job.dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    if dataset.owner_id != current_user.id and not dataset.is_public:
        raise HTTPException(status_code=403, detail="Access denied to dataset")
    
    # Verify model exists and user has access
    model = db.query(Model).filter(Model.id == job.model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    
    if model.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied to model")
    
    # Create training job
    db_job = TrainingJob(
        user_id=current_user.id,
        dataset_id=job.dataset_id,
        model_id=job.model_id,
        epochs=job.epochs,
        batch_size=job.batch_size,
        img_size=job.img_size,
        learning_rate=job.learning_rate,
        patience=job.patience,
        status=TrainingStatus.PENDING
    )
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    
    # Start training in background
    background_tasks.add_task(train_yolo_model, db_job.id)
    
    return db_job


@router.get("/", response_model=List[TrainingJobSchema])
def list_training_jobs(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all training jobs for current user."""
    jobs = db.query(TrainingJob).filter(
        TrainingJob.user_id == current_user.id
    ).order_by(TrainingJob.created_at.desc()).offset(skip).limit(limit).all()
    return jobs


@router.get("/{job_id}", response_model=TrainingJobSchema)
def get_training_job(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get training job by ID."""
    job = db.query(TrainingJob).filter(TrainingJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Training job not found")
    
    if job.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return job


@router.delete("/{job_id}")
def cancel_training_job(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel a training job (if running) or delete it."""
    job = db.query(TrainingJob).filter(TrainingJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Training job not found")
    
    if job.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if job.status == TrainingStatus.RUNNING:
        # In a real implementation, you would signal the training process to stop
        job.status = TrainingStatus.FAILED
        job.error_message = "Training cancelled by user"
        job.completed_at = datetime.utcnow()
        db.commit()
        return {"message": "Training job cancelled"}
    else:
        db.delete(job)
        db.commit()
        return {"message": "Training job deleted"}


@router.get("/{job_id}/logs")
def get_training_logs(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get training logs for a job."""
    job = db.query(TrainingJob).filter(TrainingJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Training job not found")
    
    if job.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return {
        "job_id": job.id,
        "status": job.status,
        "current_epoch": job.current_epoch,
        "total_epochs": job.epochs,
        "best_map": job.best_map,
        "logs": job.logs or "No logs available yet"
    }
