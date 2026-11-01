"""
backend/features/dashboard/router.py
FastAPI route endpoints for Creator Dashboard.
Aggregates high-level metrics, recent creations, YouTube connectivity, and system diagnostics.
"""

import time
import logging
from fastapi import APIRouter, HTTPException, status
from .schemas import DashboardSummaryResponse
from .service import get_dashboard_summary

logger = logging.getLogger("ApexMind.features.dashboard")
router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

SERVER_START_TIME = time.time()

@router.get(
    "/summary",
    response_model=DashboardSummaryResponse,
    summary="Get Creator Dashboard Summary",
    description="Retrieve comprehensive statistics, recent videos, AI scripts, channel pulse, and system health for the dashboard."
)
async def get_dashboard_summary_endpoint():
    try:
        return get_dashboard_summary(SERVER_START_TIME)
    except Exception as e:
        logger.error(f"Failed to compile dashboard summary: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate dashboard summary: {str(e)}"
        )
