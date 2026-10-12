"""
backend/features/dashboard/router.py
FastAPI route endpoints for dashboard stats and analytics.
"""

import logging
from fastapi import APIRouter, HTTPException, status
from .schemas import DashboardStatsResponse
from .service import get_stats

logger = logging.getLogger("ApexMind.features.dashboard")
router = APIRouter(tags=["Dashboard"])

@router.get(
    "/api/dashboard/stats",
    response_model=DashboardStatsResponse,
    summary="Get dashboard statistics",
    description="Retrieve live KPI metric statistics calculated from the database."
)
async def get_dashboard_stats_route():
    try:
        return get_stats()
    except Exception as e:
        logger.error(f"Error fetching dashboard stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve dashboard stats."
        )
