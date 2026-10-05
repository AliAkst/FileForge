import sys
import os

# Add backend to sys.path so we can import app
sys.path.append(os.path.join(os.path.dirname(__file__), "../../../"))

from backend.app.infrastructure.config.settings import settings

def test_settings_load():
    print(f"Testing settings loading...")
    print(f"Project Name: {settings.PROJECT_NAME}")
    print(f"API Version: {settings.API_V1_STR}")
    
    assert settings.PROJECT_NAME == "FileForge"
    assert settings.API_V1_STR == "/api/v1"
    print("Settings loaded successfully!")

if __name__ == "__main__":
    try:
        test_settings_load()
    except Exception as e:
        print(f"Error loading settings: {e}")
        sys.exit(1)
