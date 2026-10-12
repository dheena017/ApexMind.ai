import logging
from typing import Dict, Any
from .repository import calculate_dashboard_metrics

logger = logging.getLogger("ApexMind.Dashboard")

def get_stats() -> Dict[str, Any]:
    metrics = calculate_dashboard_metrics()
    logger.info(
        f"Aggregated metrics -> {metrics.get('totalShortsGenerated', 0)} shorts, "
        f"{metrics.get('totalViews', 0)} views, "
        f"{metrics.get('totalLikes', 0)} likes, "
        f"{metrics.get('activeChannelsCount', 0)} active channels"
    )
    return {
        "success": True,
        **metrics,
    }

