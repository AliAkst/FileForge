from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "FileForge"
    API_V1_STR: str = "/api/v1"
    
    # In a real app, these would be loaded from .env
    # For now, we just define them to ensure Pydantic can read them.
    
    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()
