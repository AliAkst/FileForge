import pytest
from datetime import datetime
from backend.app.domain.entities import Job, JobStatus, ConversionResult


def test_job_lifecycle():
    job_id = "test-job-123"
    source = "input.docx"
    target = "pdf"
    
    job = Job(id=job_id, source_path=source, target_format=target)
    
    assert job.id == job_id
    assert job.status == JobStatus.QUEUED
    assert job.created_at <= datetime.now()

    # Test Running
    job.mark_running()
    assert job.status == JobStatus.RUNNING

    # Test Success
    result = ConversionResult(output_path="output.pdf", metadata={"size": 1024})
    job.mark_succeeded(result)
    assert job.status == JobStatus.SUCCEEDED
    assert job.result == result
    assert job.result.output_path == "output.pdf"

    # Test Failure
    new_job = Job(id="fail-job", source_path="fail.docx", target_format="pdf")
    new_job.mark_failed("Error during conversion")
    assert new_job.status == JobStatus.FAILED
    assert new_job.error_message == "Error during conversion"

    # Test Expired
    expire_job = Job(id="expire-job", source_path="expire.docx", target_format="pdf")
    expire_job.mark_expired()
    assert expire_job.status == JobStatus.EXPIRED
