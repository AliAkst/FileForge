from typing import Protocol, Dict, Any, List, Optional
from backend.app.domain.entities import Job, ConversionResult


class Converter(Protocol):
    id: str
    supported_source_formats: List[str]
    target_format: str
    options_schema: Dict[str, Any]

    def convert(self, input_path: str, output_dir: str, options: Dict[str, Any]) -> ConversionResult:
        """
        Converts a file from source format to target format.
        """
        ...


class JobRepository(Protocol):
    def save(self, job: Job) -> None:
        """Saves a job to the repository."""
        ...

    def get_by_id(self, job_id: str) -> Optional[Job]:
        """Retrieves a job by its ID."""
        ...

    def list_all(self) -> List[Job]:
        """Lists all jobs in the repository."""
        ...

    def delete(self, job_id: str) -> None:
        """Deletes a job from the repository."""
        ...


class FileStorage(Protocol):
    def save(self, file_name: str, content: bytes) -> str:
        """Saves file content and returns the stored file path."""
        ...

    def get_path(self, file_path: str) -> str:
        """Returns the local path for a stored file."""
        ...

    def delete(self, file_path: str) -> None:
        """Deletes a file from storage."""
        ...
