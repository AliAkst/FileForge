# FileForge Architecture

FileForge follows **Clean Architecture** principles, ensuring that the core business logic (Domain) is isolated from external concerns like databases, web frameworks, or file systems.

## 1. Layers

### Domain Layer (`backend/app/domain/`)
The heart of the application. Contains:
- **Entities**: Core business objects (e.g., `ConversionJob`).
- **Value Objects**: Immutable objects (e.g., `FileFormat`, `FileExtension`).
- **Ports (Interfaces)**: Definitions for what the application needs (e.g., `Converter`, `JobRepository`, `FileStorage`).
- **Rules**: Business logic that is independent of any technical implementation.
- **Constraint**: NO third-party imports allowed here.

### Application Layer (`backend/app/application/`)
Orchestrates the flow of data to and from the domain. Contains:
- **Use Cases**: Specific business actions (e.g., `SubmitConversion`, `GetJobStatus`, `CleanupExpiredJobs`).
- **DTOs**: Data Transfer Objects for input/output.

### Infrastructure Layer (`backend/app/infrastructure/`)
Implements the ports defined in the Domain layer. Contains:
- **Converters**: Concrete implementations of the `Converter` port (e.g., `DocxToPdfConverter`).
- **Storage**: Adapters for file storage (e.g., `LocalStorage`, `S3Storage`).
- **Queue**: Adapters for job queues (e.g., `InMemoryQueue`, `RedisQueue`).
- **Config**: Application configuration management.

### Presentation Layer (`backend/app/presentation/`)
The entry point for external users/systems. Contains:
- **API Routers**: FastAPI endpoints.
- **Schemas**: Pydantic models for request/response validation.
- **DI Wiring**: Dependency Injection configuration.

---

## 2. The Converter System

Extensibility is achieved through a plugin-like architecture for file converters.

### The `Converter` Port
Every converter must implement the following interface:

```python
class Converter(Protocol):
    id: str
    supported_source_formats: list[str]
    target_format: str
    options_schema: dict  # JSON Schema for UI generation
    
    async def convert(self, input_path: Path, output_dir: Path, options: dict) -> ConversionResult:
        ...
```

### Registry & Auto-discovery
- **Discovery**: At startup, the application scans `backend/app/infrastructure/converters/`.
- **Registration**: Converters use a `@register_converter` decorator to announce themselves.
- **Registry**: A central registry stores all discovered converters, indexed by their capabilities.
- **Capability API**: The `GET /api/v1/capabilities` endpoint queries the registry to return a list of available conversions and their required options.

---

## 3. Job Lifecycle

Conversion tasks are managed as asynchronous jobs.

**States:**
1. `queued`: Job has been submitted and is waiting for a worker.
2. `running`: A worker has picked up the job and is currently processing.
3. `succeeded`: Conversion finished successfully. Result is ready for download.
4. `failed`: An error occurred during conversion.
5. `expired`: The job or its result exceeded the retention period and was auto-deleted.

---

## 4. API Contract

### Versioning
All API endpoints are prefixed with `/api/v1`.

### Error Format
FileForge uses the **RFC 7807 (Problem Details for HTTP APIs)** standard for errors.

```json
{
  "type": "https://fileforge.app/errors/invalid-format",
  "title": "Unsupported File Format",
  "status": 400,
  "detail": "The uploaded file is a .txt file, but a .pdf is required.",
  "instance": "/api/v1/convert/job-123"
}
```
