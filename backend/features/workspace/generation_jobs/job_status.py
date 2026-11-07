"""
backend/features/workspace/generation_jobs/job_status.py
Status and lifecycle phases for ApexMind generation jobs.
"""

from enum import Enum


class JobStatus(str, Enum):
    QUEUED = "queued"
    IN_PROGRESS = "in_progress"
    PROCESSING = "processing"
    COMPLETED = "completed"
    PARTIALLY_COMPLETED = "partially_completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class JobPhase(str, Enum):
    QUEUED = "QUEUED"
    BUILDING_PROMPT = "BUILDING_PROMPT"
    CALLING_AI = "CALLING_AI"
    PARSING_RESPONSE = "PARSING_RESPONSE"
    VALIDATING_SCENES = "VALIDATING_SCENES"
    PLANNING_ASSETS = "PLANNING_ASSETS"
    # Stage 2 Voice Generation Phases
    PREPROCESSING = "PREPROCESSING"
    SYNTHESIS = "SYNTHESIS"
    NORMALIZATION = "NORMALIZATION"
    ASSEMBLY = "ASSEMBLY"
    # Terminal Phases
    COMPLETED = "COMPLETED"
    PARTIALLY_COMPLETED = "PARTIALLY_COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"

