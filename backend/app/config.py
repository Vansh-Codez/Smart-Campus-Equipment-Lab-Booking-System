import os
from pydantic_settings import BaseSettings

raw_db_url = os.getenv("DATABASE_URL", "sqlite:///./campus_booking.db")
if raw_db_url.startswith("postgres://"):
    raw_db_url = raw_db_url.replace("postgres://", "postgresql://", 1)

class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart Campus Equipment & Lab Booking System"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "campus-super-secret-jwt-key-change-in-prod-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    DATABASE_URL: str = raw_db_url
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.campus.edu")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", 587))
    SMTP_USER: str = os.getenv("SMTP_USER", "notifications@campus.edu")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "campus_email_pass")
    EMAILS_FROM_EMAIL: str = os.getenv("EMAILS_FROM_EMAIL", "no-reply@campus.edu")

    class Config:
        case_sensitive = True

settings = Settings()
