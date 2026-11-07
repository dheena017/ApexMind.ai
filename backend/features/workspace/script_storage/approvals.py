"""
backend/features/workspace/script_storage/approvals.py

Approval lifecycle state machine for Script Generation Architecture v2 (Milestone 7).
Enforces valid state transitions and audit logging across the production pipeline.
"""

from enum import Enum
from typing import Dict, List, Optional, Set
from datetime import datetime, timezone


class ApprovalStage(str, Enum):
    CONCEPT = "concept"
    NARRATIVE = "narrative"
    ANIMATIC = "animatic"
    PRODUCTION = "production"


class ApprovalState(str, Enum):
    DRAFT = "draft"
    REVIEW_READY = "review_ready"
    CONCEPT_APPROVED = "concept_approved"
    NARRATIVE_APPROVED = "narrative_approved"
    ANIMATIC_APPROVED = "animatic_approved"
    PRODUCTION_READY = "production_ready"
    CHANGES_REQUESTED = "changes_requested"
    REJECTED = "rejected"


# Strict state machine transition map
VALID_TRANSITIONS: Dict[ApprovalState, Set[ApprovalState]] = {
    ApprovalState.DRAFT: {ApprovalState.REVIEW_READY, ApprovalState.REJECTED},
    ApprovalState.REVIEW_READY: {
        ApprovalState.CONCEPT_APPROVED,
        ApprovalState.CHANGES_REQUESTED,
        ApprovalState.REJECTED,
    },
    ApprovalState.CHANGES_REQUESTED: {ApprovalState.DRAFT, ApprovalState.REVIEW_READY, ApprovalState.REJECTED},
    ApprovalState.CONCEPT_APPROVED: {
        ApprovalState.NARRATIVE_APPROVED,
        ApprovalState.CHANGES_REQUESTED,
        ApprovalState.REJECTED,
    },
    ApprovalState.NARRATIVE_APPROVED: {
        ApprovalState.ANIMATIC_APPROVED,
        ApprovalState.CHANGES_REQUESTED,
        ApprovalState.REJECTED,
    },
    ApprovalState.ANIMATIC_APPROVED: {
        ApprovalState.PRODUCTION_READY,
        ApprovalState.CHANGES_REQUESTED,
        ApprovalState.REJECTED,
    },
    ApprovalState.PRODUCTION_READY: set(),
    ApprovalState.REJECTED: {ApprovalState.DRAFT},
}


class ApprovalManager:
    """Manages approval state transitions and validates operational requirements."""

    @staticmethod
    def can_transition(current: ApprovalState, target: ApprovalState) -> bool:
        allowed = VALID_TRANSITIONS.get(current, set())
        return target in allowed

    @staticmethod
    def transition(
        current: ApprovalState,
        target: ApprovalState,
        approved_by: Optional[str] = None,
        comments: Optional[str] = None,
    ) -> Dict[str, str]:
        if not ApprovalManager.can_transition(current, target):
            raise ValueError(
                f"Invalid approval state transition from '{current.value}' to '{target.value}'."
            )

        now = datetime.now(timezone.utc).isoformat()
        return {
            "fromState": current.value,
            "toState": target.value,
            "approvedBy": approved_by or "system",
            "approvedAt": now,
            "comments": comments or "",
        }

