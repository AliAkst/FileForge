import os

directories = [
    "backend/app/domain/",
    "backend/app/application/",
    "backend/app/infrastructure/converters/",
    "backend/app/infrastructure/storage/",
    "backend/app/infrastructure/queue/",
    "backend/app/infrastructure/config/",
    "backend/app/presentation/",
    "backend/tests/unit/",
    "backend/tests/integration/",
    "backend/tests/fixtures/",
    "frontend/src/features/",
    "frontend/src/components/",
    "frontend/src/api/",
    "frontend/src/i18n/",
    "docker/",
    "scripts/",
    "docs/"
]

base_path = r"C:\Users\alium\Desktop\Proje2"

for directory in directories:
    path = os.path.join(base_path, directory)
    os.makedirs(path, exist_ok=True)
    print(f"Created: {path}")
