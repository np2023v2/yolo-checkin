from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://yolouser:yolopass@localhost:5432/yolodb"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # API
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "YOLO Trainer Platform"
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # File Storage
    UPLOAD_DIR: str = "./uploads"
    MODEL_DIR: str = "./models"
    DATASET_DIR: str = "./datasets"
    MAX_UPLOAD_SIZE: int = 100 * 1024 * 1024  # 100MB
    
    # YOLO Training
    DEFAULT_EPOCHS: int = 100
    DEFAULT_BATCH_SIZE: int = 16
    DEFAULT_IMG_SIZE: int = 640
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
