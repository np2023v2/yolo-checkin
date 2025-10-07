from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text, Float, JSON, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base
import enum


class TrainingStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    datasets = relationship("Dataset", back_populates="owner")
    models = relationship("Model", back_populates="owner")
    training_jobs = relationship("TrainingJob", back_populates="user")


class Dataset(Base):
    __tablename__ = "datasets"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    owner_id = Column(Integer, ForeignKey("users.id"))
    num_classes = Column(Integer, default=0)
    num_images = Column(Integer, default=0)
    class_names = Column(JSON)  # List of class names
    is_public = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    owner = relationship("User", back_populates="datasets")
    images = relationship("DatasetImage", back_populates="dataset", cascade="all, delete-orphan")
    training_jobs = relationship("TrainingJob", back_populates="dataset")


class DatasetImage(Base):
    __tablename__ = "dataset_images"
    
    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id"))
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    width = Column(Integer)
    height = Column(Integer)
    is_labeled = Column(Boolean, default=False)
    split = Column(String, default="train")  # train, val, test
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    dataset = relationship("Dataset", back_populates="images")
    annotations = relationship("Annotation", back_populates="image", cascade="all, delete-orphan")


class Annotation(Base):
    __tablename__ = "annotations"
    
    id = Column(Integer, primary_key=True, index=True)
    image_id = Column(Integer, ForeignKey("dataset_images.id"))
    class_id = Column(Integer, nullable=False)
    class_name = Column(String, nullable=False)
    x_center = Column(Float, nullable=False)  # Normalized 0-1
    y_center = Column(Float, nullable=False)  # Normalized 0-1
    width = Column(Float, nullable=False)     # Normalized 0-1
    height = Column(Float, nullable=False)    # Normalized 0-1
    confidence = Column(Float, default=1.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    image = relationship("DatasetImage", back_populates="annotations")


class Model(Base):
    __tablename__ = "models"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    owner_id = Column(Integer, ForeignKey("users.id"))
    model_type = Column(String, default="yolov8n")  # yolov8n, yolov8s, yolov8m, yolov8l, yolov8x
    file_path = Column(String)
    num_classes = Column(Integer)
    class_names = Column(JSON)
    metrics = Column(JSON)  # mAP, precision, recall, etc.
    is_public = Column(Boolean, default=False)
    is_deployed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    owner = relationship("User", back_populates="models")
    training_jobs = relationship("TrainingJob", back_populates="model")


class TrainingJob(Base):
    __tablename__ = "training_jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    dataset_id = Column(Integer, ForeignKey("datasets.id"))
    model_id = Column(Integer, ForeignKey("models.id"))
    status = Column(SQLEnum(TrainingStatus), default=TrainingStatus.PENDING)
    
    # Training parameters
    epochs = Column(Integer, default=100)
    batch_size = Column(Integer, default=16)
    img_size = Column(Integer, default=640)
    learning_rate = Column(Float, default=0.01)
    patience = Column(Integer, default=50)  # Early stopping patience
    
    # Results
    current_epoch = Column(Integer, default=0)
    best_map = Column(Float)
    training_time = Column(Float)  # in seconds
    logs = Column(Text)
    error_message = Column(Text)
    
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="training_jobs")
    dataset = relationship("Dataset", back_populates="training_jobs")
    model = relationship("Model", back_populates="training_jobs")


class Person(Base):
    __tablename__ = "persons"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    employee_id = Column(String, unique=True, index=True)
    department = Column(String)
    face_encoding = Column(JSON)  # Store face encoding as JSON array
    photo_path = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    attendance_records = relationship("AttendanceRecord", back_populates="person")


class AttendanceRecord(Base):
    __tablename__ = "attendance_records"
    
    id = Column(Integer, primary_key=True, index=True)
    person_id = Column(Integer, ForeignKey("persons.id"))
    check_in_time = Column(DateTime(timezone=True), server_default=func.now())
    check_out_time = Column(DateTime(timezone=True))
    photo_path = Column(String)  # Photo taken during check-in
    confidence = Column(Float)  # Face recognition confidence
    location = Column(String)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    person = relationship("Person", back_populates="attendance_records")
