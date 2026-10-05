from dataclasses import dataclass, field
from enum import Enum, auto
from datetime import datetime
from typing import Any, Dict, Optional


class JobStatus(Enum):
    QUEUED = auto()
    RUNNING = auto()
    SUCCEEDED = auto()
    FAILED = auto()
    EXPIRED = auto()


@dataclass(frozen=True)
class ConversionResult:
    output_path: str
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class Job:
    id: str
    source_path: str
    target_format: str
    status: JobStatus = JobStatus.QUEUED
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    result: Optional[ConversionResult] = None
    error_message: Optional[str] = None
    options: Dict[str, Any] = field(default_factory=dict)

    def mark_running(self):
        self.status = JobStatus.RUNNING
        self.updated_at = datetime.now()

    def mark_succeeded(self, result: ConversionResult):
        self.status = JobStatus.SUCCEEDED
        self.result = result
        self.updated_at = datetime.now()

    def mark_failed(self, error: str):
        self.status = JobStatus.FAILED
        self.error_message = error
        self.updated_at = datetime.now()

    def mark_expired(self):
        self.status = JobStatus.EXPIRED
        self.updated_at = datetime.now()
